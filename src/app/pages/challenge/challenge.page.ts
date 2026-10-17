import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { IonContent, IonIcon, NavController } from '@ionic/angular';
import { CHALLENGE_BY_ID, Challenge } from '../../core/challenges.data';
import { EvidenceService } from '../../core/evidence.service';
import { GameStore } from '../../core/game.store';
import { levelFromXP } from '../../core/levels';
import { HeaderComponent } from '../../shared/header.component';
import { MascotComponent } from '../../shared/mascot.component';
import { FormChallengeRunner } from './runners/form-runner';
import { ListChallengeRunner } from './runners/list-runner';
import { PhotoChallengeRunner } from './runners/photo-runner';
import { RunnerResult } from './runners/runner';
import { FastChallengeRunner, HardDayChallengeRunner, LogDaysChallengeRunner, PeerChallengeRunner, PlannerChallengeRunner, SleepChallengeRunner, StreakChallengeRunner } from './runners/system-runners';
import { TimerChallengeRunner } from './runners/timer-runner';

@Component({
  selector: 'app-challenge',
  standalone: true,
  imports: [
    IonContent, IonIcon, DatePipe, HeaderComponent, MascotComponent, TimerChallengeRunner, PhotoChallengeRunner, FormChallengeRunner, ListChallengeRunner,
    StreakChallengeRunner, LogDaysChallengeRunner, FastChallengeRunner, SleepChallengeRunner, HardDayChallengeRunner, PeerChallengeRunner, PlannerChallengeRunner,
  ],
  template: `
    <app-header [title]="ch()?.name ?? 'Reto'" [subtitle]="ch() ? 'Nivel ' + ch()!.level + ' · reto ' + ch()!.n + ' de 8' : ''" backHref="/tabs/challenges" />
    <ion-content class="page">
      <div class="wrap">
        @if (!ch()) {
          <div class="card center"><p>No encontramos este reto.</p></div>
        } @else {
          <section class="card grad grad-brand fade-up">
            <div class="row">
              <div class="ico"><ion-icon [name]="ch()!.icon" /></div>
              <div class="grow"><small class="op">CÓMO SE VALIDA</small><p class="mech">{{ ch()!.mech }}</p></div>
            </div>
            <div class="row chips">
              <span class="chip white"><ion-icon name="flash" />{{ ch()!.xp }} XP</span>
              <span class="chip white"><ion-icon name="time-outline" />{{ timeText() }}</span>
              <span class="chip white">{{ ch()!.difficulty }}</span>
            </div>
          </section>

          @if (celebrate()) {
            <section class="card soft-green center pop">
              <app-mascot mood="happy" [size]="110" [animated]="true" />
              <h2 style="margin-top:6px">¡Reto completado!</h2>
              <p class="muted bold">+{{ ch()!.xp }} XP</p>
              <div class="row" style="justify-content:center;margin-top:12px;flex-wrap:wrap">
                @if (next()) { <button class="btn" (click)="open(next()!)">Siguiente reto</button> }
                <button class="btn ghost" (click)="back()">Volver a retos</button>
              </div>
            </section>
          } @else if (done()) {
            <section class="card soft-green col">
              <div class="row"><ion-icon name="checkmark-circle" class="okc" /><div class="grow"><b>Completado</b><p class="small muted">{{ done()!.at | date: "d 'de' MMMM y, HH:mm" : '' : 'es-MX' }} · +{{ done()!.xp }} XP</p></div></div>
              @if (summary().length) {
                <div class="col sm">@for (s of summary(); track $index) { <div class="line"><small class="muted bold">{{ s.k }}</small><p class="small">{{ s.v }}</p></div> }</div>
              }
              @if (photos().length) { <div class="row wrapflex">@for (p of photos(); track p) { <img [src]="p" class="ph" alt="Evidencia guardada" /> }</div> }
            </section>
          } @else if (locked()) {
            <section class="card center col"><ion-icon name="lock-closed" style="font-size:40px;color:#9a96bd" /><b>Reto bloqueado</b><p class="small muted">Se desbloquea al llegar al Nivel {{ ch()!.level }} ({{ levelXp() }} XP).</p></section>
          } @else {
            @switch (ch()!.v.t) {
              @case ('timer') { <app-run-timer [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('breathing') { <app-run-timer [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('photo') { <app-run-photo [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('text') { <app-run-form [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('checkin') { <app-run-form [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('list') { <app-run-list [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('table') { <app-run-list [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('streak') { <app-run-streak [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('logdays') { <app-run-logdays [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('fast') { <app-run-fast [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('sleeplock') { <app-run-sleep [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('hardday') { <app-run-hardday [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('peer') { <app-run-peer [ch]="ch()!" (complete)="finish($event)" /> }
              @case ('planner') { <app-run-planner [ch]="ch()!" (complete)="finish($event)" /> }
            }
          }
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .ico { width: 50px; height: 50px; border-radius: 17px; background: rgba(255,255,255,.2); display: grid; place-items: center; font-size: 27px; flex-shrink: 0; }
    .op { opacity: .85; font-weight: 800; letter-spacing: 1.3px; font-size: 10.5px; } .mech { font-size: 15px; font-weight: 700; line-height: 1.35; margin-top: 2px; } .chips { gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .okc { color: var(--g-green); font-size: 34px; } .line p { white-space: pre-line; word-break: break-word; } .ph { width: 92px; height: 92px; object-fit: cover; border-radius: 16px; }
  `],
})
export class ChallengePage implements OnDestroy {
  private game = inject(GameStore);
  private nav = inject(NavController);
  private evidence = inject(EvidenceService);

  private idSig = signal('');
  @Input() set id(v: string) { this.idSig.set(v); this.celebrate.set(false); }

  ch = computed<Challenge | null>(() => CHALLENGE_BY_ID.get(this.idSig()) ?? null);
  done = computed(() => (this.ch() ? this.game.completedOf(this.ch()!.id) : undefined));
  locked = computed(() => !!this.ch() && this.game.isLocked(this.ch()!));
  celebrate = signal(false);
  photos = signal<string[]>([]);
  levelXp = computed(() => this.ch() ? this.game.levels.find((l) => l.level === this.ch()!.level)?.xpRequired.toLocaleString('es-MX') : '');
  next = computed(() => {
    const f = this.game.featured();
    return f && f.id !== this.ch()?.id ? f : null;
  });
  timeText = computed(() => {
    const m = this.ch()?.minutes ?? 0;
    return m === 0 ? 'Varios días' : m >= 60 ? `${Math.round((m / 60) * 10) / 10} h` : `${m} min`;
  });
  summary = computed(() => {
    const data = this.done()?.data ?? {};
    const out: { k: string; v: string }[] = [];
    const label: Record<string, string> = { prioridades: 'Prioridades', reflexion: 'Reflexión', main: 'Tarea', items: 'Elementos', tarea: 'Tarea', practica: 'Práctica', concepto: 'Concepto', explicacion: 'Explicación', fallo: 'Fallo', protocolo: 'Protocolo', critica: 'Crítica', plan: 'Plan', obstaculo: 'Obstáculo', rutina: 'Rutina', companero: 'Compañero', apoyo: 'Apoyo', ensayo: 'Ensayo', link: 'Enlace', deadline: 'Fecha límite', workMinutes: 'Minutos de trabajo', streakDays: 'Racha validada (días)', peer: 'Mentor', text: 'Texto', confirmedBy: 'Confirmado por' };
    for (const [k, v] of Object.entries(data)) {
      if (k === 'seed' || v === undefined || v === null || ['capturedAt', 'checkedInAt', 'validatedBy', 'confirmedAt', 'codes'].includes(k)) continue;
      const text = Array.isArray(v) ? v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join('\n') : typeof v === 'object' ? JSON.stringify(v) : String(v);
      if (text.trim()) out.push({ k: label[k] ?? k, v: text });
    }
    return out;
  });

  private urls: string[] = [];

  constructor() {
    effect(() => {
      const d = this.done();
      this.urls.forEach((u) => URL.revokeObjectURL(u));
      this.urls = [];
      this.photos.set([]);
      const ids = d?.evidenceIds ?? [];
      if (!ids.length) return;
      void Promise.all(ids.map((i) => this.evidence.get(i))).then((recs) => {
        this.urls = recs.filter((r) => r && r.mime.startsWith('image/')).map((r) => URL.createObjectURL(r!.blob));
        this.photos.set([...this.urls]);
      });
    });
  }

  finish(r: RunnerResult): void {
    const c = this.ch();
    if (!c) return;
    if (this.game.award(c, r.data, r.evidenceIds)) this.celebrate.set(true);
  }

  open(c: Challenge): void { this.celebrate.set(false); void this.nav.navigateForward('/challenge/' + c.id); }
  back(): void { void this.nav.navigateBack('/tabs/challenges'); }
  ngOnDestroy(): void { this.urls.forEach((u) => URL.revokeObjectURL(u)); }
}
