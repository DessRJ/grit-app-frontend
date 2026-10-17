import { Injectable, computed, inject, signal } from '@angular/core';
import { CHALLENGES, Challenge, challengesOfLevel } from './challenges.data';
import { BADGES } from './content';
import { DbService } from './db.service';
import { LEVELS, MAX_LEVEL, levelFromXP, nextLevelOf } from './levels';
import { CompletedChallenge, Level, PendingChallenge, UserState } from './models';
import { dayStr, streakOf } from './util';

export interface RewardEvent {
  title: string;
  xp: number;
}

/**
 * Estado de juego reactivo del usuario activo.
 * La fuente de verdad es IndexedDB (store "state"); aquí se mantiene una copia en señales.
 */
@Injectable({ providedIn: 'root' })
export class GameStore {
  private db = inject(DbService);

  readonly state = signal<UserState | null>(null);
  /** Día actual (se refresca al volver a primer plano) */
  readonly today = signal(dayStr());

  readonly reward = signal<RewardEvent | null>(null);
  readonly levelUp = signal<Level | null>(null);

  readonly xp = computed(() => this.state()?.xp ?? 0);
  readonly name = computed(() => this.state()?.name ?? '');
  readonly level = computed<Level>(() => levelFromXP(this.xp()));
  readonly nextLevel = computed(() => nextLevelOf(this.level().level));
  readonly xpIntoLevel = computed(() => this.xp() - this.level().xpRequired);
  readonly xpNeeded = computed(() => {
    const n = this.nextLevel();
    return n ? n.xpRequired - this.level().xpRequired : 0;
  });
  readonly xpMissing = computed(() => {
    const n = this.nextLevel();
    return n ? n.xpRequired - this.xp() : 0;
  });
  readonly levelPct = computed(() => {
    const n = this.nextLevel();
    if (!n) return 100;
    return Math.min(100, Math.round((this.xpIntoLevel() / this.xpNeeded()) * 100));
  });
  readonly isMaster = computed(() => this.level().level >= MAX_LEVEL);

  readonly activityStreak = computed(() => streakOf(this.state()?.activityDays ?? [], this.today()));
  readonly challengeStreak = computed(() => streakOf(this.state()?.challengeDays ?? [], this.today()));
  /** Racha mostrada al usuario: días seguidos con actividad */
  readonly streak = this.activityStreak;

  readonly completedCount = computed(() => Object.keys(this.state()?.completed ?? {}).length);
  readonly levelChallenges = computed(() => challengesOfLevel(this.level().level));
  readonly pendingInLevel = computed(() => this.levelChallenges().filter((c) => !this.isDone(c.id)));
  readonly levelDoneCount = computed(() => this.levelChallenges().filter((c) => this.isDone(c.id)).length);
  /** Reto sugerido: el primero pendiente del nivel actual */
  readonly featured = computed<Challenge | null>(() => this.pendingInLevel()[0] ?? null);
  readonly demoSpeed = computed(() => this.state()?.settings.demoSpeed ?? false);

  readonly badges = computed(() => {
    const s = this.state();
    if (!s) return [];
    const done = Object.keys(s.completed).length;
    const p = s.personalPlan;
    const planDone = !!(p.goal && p.reason && p.nextStep && p.obstacle && p.strategy);
    const rules: Record<string, boolean> = {
      first: done >= 1,
      focus10: s.focusSessions >= 10,
      xp300: s.xp >= 300,
      challenges5: done >= 5,
      streak7: this.activityStreak() >= 7,
      xp1350: s.xp >= 1350,
      mood10: this.moodCount() >= 10,
      focus20: s.focusSessions >= 20,
      challenges30: done >= 30,
      streak30: this.activityStreak() >= 30,
      xp5250: s.xp >= 5250,
      plan: planDone,
    };
    return BADGES.map((b) => ({ ...b, unlocked: !!rules[b.id] }));
  });

  /** Cantidad de registros de ánimo (se alimenta desde MoodService) */
  readonly moodCount = signal(0);

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const flush = () => this.flush();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
      else this.today.set(dayStr());
    });
    window.addEventListener('pagehide', flush);
  }

  async load(userId: string): Promise<void> {
    const s = await this.db.get<UserState>('state', userId);
    this.state.set(s ?? null);
    this.today.set(dayStr());
    this.reward.set(null);
    this.levelUp.set(null);
    this.checkLevelUp();
  }

  unload(): void {
    this.flush();
    this.state.set(null);
  }

  // ---------- utilidades de lectura ----------
  isDone(id: string): boolean {
    return !!this.state()?.completed[id];
  }

  completedOf(id: string): CompletedChallenge | undefined {
    return this.state()?.completed[id];
  }

  /** Un reto está disponible si pertenece al nivel actual y no está completado */
  isAvailable(c: Challenge): boolean {
    return c.level === this.level().level && !this.isDone(c.id);
  }

  isLocked(c: Challenge): boolean {
    return c.level > this.level().level;
  }

  streakFor(basis: 'activity' | 'challenge'): number {
    return basis === 'activity' ? this.activityStreak() : this.challengeStreak();
  }

  pendingOf(id: string): PendingChallenge {
    return this.state()?.pending[id] ?? {};
  }

  // ---------- escritura ----------
  update(fn: (s: UserState) => UserState | void): void {
    const cur = this.state();
    if (!cur) return;
    const draft = structuredClone(cur);
    const out = fn(draft) ?? draft;
    this.state.set(out);
    this.schedulePersist();
  }

  patch(p: Partial<UserState>): void {
    this.update((s) => ({ ...s, ...p }));
  }

  setPending(id: string, p: Partial<PendingChallenge>): void {
    this.update((s) => {
      s.pending[id] = { ...(s.pending[id] ?? {}), ...p };
    });
  }

  clearPending(id: string): void {
    this.update((s) => {
      delete s.pending[id];
    });
  }

  markActivity(): void {
    const d = dayStr();
    this.today.set(d);
    this.update((s) => {
      if (!s.activityDays.includes(d)) s.activityDays = [...s.activityDays, d];
    });
  }

  /** Completa un reto, otorga XP y detecta subida de nivel. Devuelve false si ya estaba completo. */
  award(c: Challenge, data?: Record<string, unknown>, evidenceIds?: string[]): boolean {
    const s = this.state();
    if (!s || s.completed[c.id]) return false;
    const d = dayStr();
    this.today.set(d);
    this.update((st) => {
      st.completed[c.id] = { at: Date.now(), xp: c.xp, data, evidenceIds };
      st.xp += c.xp;
      if (!st.challengeDays.includes(d)) st.challengeDays = [...st.challengeDays, d];
      if (!st.activityDays.includes(d)) st.activityDays = [...st.activityDays, d];
      delete st.pending[c.id];
    });
    this.reward.set({ title: c.name, xp: c.xp });
    this.checkLevelUp();
    return true;
  }

  logFocusSession(minutes: number): void {
    const d = dayStr();
    this.update((s) => {
      s.focusSessions += 1;
      s.focusMinutes += minutes;
      if (!s.activityDays.includes(d)) s.activityDays = [...s.activityDays, d];
    });
  }

  private checkLevelUp(): void {
    const s = this.state();
    if (!s) return;
    const cur = levelFromXP(s.xp);
    if (cur.level > s.levelUpShown) this.levelUp.set(cur);
  }

  acknowledgeLevelUp(): void {
    const l = this.levelUp();
    if (!l) return;
    this.update((s) => {
      s.levelUpShown = l.level;
    });
    this.levelUp.set(null);
  }

  // ---------- persistencia ----------
  private schedulePersist(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flush(), 120);
  }

  flush(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    const s = this.state();
    if (s) void this.db.put('state', s);
  }

  readonly levels = LEVELS;
  readonly allChallenges = CHALLENGES;
}
