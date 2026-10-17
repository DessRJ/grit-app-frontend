import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular';
import { Challenge } from '../../../core/challenges.data';
import { GameStore } from '../../../core/game.store';
import { DayLogEntry } from '../../../core/models';
import { addDays, countWords, dayStr, fmtClock, fmtDate, fmtTime } from '../../../core/util';
import { RunnerResult } from './runner';

/* ------------------------------------------------------------------ */
/* Racha validada por el sistema                                        */
/* ------------------------------------------------------------------ */
@Component({
  selector: 'app-run-streak',
  standalone: true,
  imports: [IonIcon],
  template: `
    @if (ch.v.t === 'streak') {
      <section class="card grad grad-sunset center">
        <ion-icon name="flame" class="fl" />
        <div class="big">{{ cur() }} <span>/ {{ ch.v.days }} días</span></div>
        <div class="bar on-dark"><i [style.width.%]="Math.min(100, (cur() / ch.v.days) * 100)"></i></div>
        <p class="small op">{{ ch.v.basis === 'activity' ? 'Cuenta cualquier actividad registrada: reto, sesión de enfoque o estado de ánimo.' : 'Cuenta los días en que completaste al menos un reto.' }}</p>
      </section>
      <section class="card">
        <b class="small">Últimos días</b>
        <div class="dots">
          @for (d of last14(); track d.day) { <span class="d" [class.on]="d.on" [title]="d.day">{{ d.l }}</span> }
        </div>
        <p class="xs muted" style="margin-top:8px">Si dejas pasar un día completo sin actividad, la racha se reinicia.</p>
      </section>
      <button class="btn green xl block" [disabled]="cur() < ch.v.days" (click)="claim()">
        {{ cur() >= ch.v.days ? 'Reclamar ' + ch.xp + ' XP' : 'Te faltan ' + (ch.v.days - cur()) + ' días' }}
      </button>
    }
  `,
  styles: [`
    .fl { font-size: 46px; } .big { font-size: 44px; font-weight: 900; margin: 4px 0 10px; } .big span { font-size: 16px; opacity: .85; } .op { opacity: .92; margin-top: 10px; }
    .dots { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; } .d { width: 30px; height: 30px; border-radius: 10px; background: #eceaf5; display: grid; place-items: center; font-size: 11px; font-weight: 800; color: #9a96bd; } .d.on { background: var(--g-grad-sunset); color: #fff; }
  `],
})
export class StreakChallengeRunner {
  private game = inject(GameStore);
  @Input({ required: true }) ch!: Challenge;
  @Output() complete = new EventEmitter<RunnerResult>();
  Math = Math;
  cur = computed(() => (this.ch.v.t === 'streak' ? this.game.streakFor(this.ch.v.basis) : 0));
  last14 = computed(() => {
    const st = this.game.state();
    if (!st || this.ch.v.t !== 'streak') return [];
    const days = new Set(this.ch.v.basis === 'activity' ? st.activityDays : st.challengeDays);
    const today = this.game.today();
    return Array.from({ length: 14 }, (_, i) => addDays(today, i - 13)).map((day) => ({ day, on: days.has(day), l: String(+day.slice(8)) }));
  });
  claim(): void {
    this.complete.emit({ data: { streakDays: this.cur(), validatedBy: 'system' } });
  }
}

/* ------------------------------------------------------------------ */
/* Bitácora de varios días consecutivos                                 */
/* ------------------------------------------------------------------ */
@Component({
  selector: 'app-run-logdays',
  standalone: true,
  imports: [FormsModule, IonIcon],
  template: `
    @if (ch.v.t === 'logdays') {
      <section class="card">
        <div class="row between"><b>Avance</b><span class="chip" [class.green]="run() >= ch.v.days">{{ run() }} / {{ ch.v.days }} días seguidos</span></div>
        <div class="dots">@for (i of slots(); track i) { <span class="d" [class.on]="i < run()">{{ i + 1 }}</span> }</div>
        @if (reset()) { <p class="hint err" style="margin-top:8px">Se saltó un día: la bitácora se reinició. ¡Vuelve a empezar hoy!</p> }
      </section>

      @if (run() < ch.v.days) {
        @if (doneToday()) {
          <section class="card soft-green"><b><ion-icon name="checkmark-circle" /> Hoy ya registraste tu entrada.</b><p class="small">Vuelve mañana para continuar la racha ({{ ch.v.days - run() }} días restantes).</p></section>
        } @else {
          <section class="card col">
            <div class="field"><label for="lg">Entrada del {{ today }}</label>
              <textarea id="lg" class="textarea" rows="4" [placeholder]="ch.v.prompt" [(ngModel)]="text"></textarea></div>
            <span class="hint" [class.ok]="wc(text) >= ch.v.minWords">{{ wc(text) }} / {{ ch.v.minWords }} palabras mínimas</span>
            <button class="btn xl block" [disabled]="wc(text) < ch.v.minWords" (click)="add()">Guardar entrada de hoy</button>
          </section>
        }
      }
      @for (e of entries(); track e.day) { <div class="card flat"><small class="muted bold">{{ fmt(e.day) }}</small><p class="small">{{ e.text }}</p></div> }

      <button class="btn green xl block" [disabled]="run() < ch.v.days" (click)="claim()">{{ run() >= ch.v.days ? 'Reclamar ' + ch.xp + ' XP' : 'Completa los ' + ch.v.days + ' días' }}</button>
    }
  `,
  styles: [`.dots { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; } .d { width: 34px; height: 34px; border-radius: 12px; background: #eceaf5; display: grid; place-items: center; font-weight: 800; color: #9a96bd; } .d.on { background: var(--g-grad-fresh); color: #fff; }`],
})
export class LogDaysChallengeRunner implements OnInit {
  private game = inject(GameStore);
  @Input({ required: true }) ch!: Challenge;
  @Output() complete = new EventEmitter<RunnerResult>();
  text = '';
  today = fmtDate(Date.now(), { day: 'numeric', month: 'long' });
  reset = signal(false);
  entries = computed<DayLogEntry[]>(() => (this.game.pendingOf(this.ch.id).logs as DayLogEntry[] | undefined) ?? []);
  run = computed(() => this.entries().length);
  doneToday = computed(() => this.entries().some((e) => e.day === this.game.today()));
  slots = computed(() => Array.from({ length: this.ch.v.t === 'logdays' ? this.ch.v.days : 0 }, (_, i) => i));
  wc = countWords;
  fmt = (d: string) => fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' });

  ngOnInit(): void {
    const logs = this.entries();
    const last = logs[logs.length - 1];
    if (last && last.day < addDays(dayStr(), -1)) {
      this.game.setPending(this.ch.id, { logs: [] });
      this.reset.set(true);
    }
  }

  add(): void {
    this.game.setPending(this.ch.id, { logs: [...this.entries(), { day: dayStr(), text: this.text.trim() }] });
    this.text = '';
  }

  claim(): void {
    this.complete.emit({ data: { log: this.entries() } });
  }
}

/* ------------------------------------------------------------------ */
/* Ayuno digital parcial (6 h diurnas)                                  */
/* ------------------------------------------------------------------ */
@Component({
  selector: 'app-run-fast',
  standalone: true,
  imports: [FormsModule, IonIcon],
  template: `
    @if (ch.v.t === 'fast') {
      @if (!started()) {
        <section class="card col">
          <p class="small">Durante <b>{{ ch.v.hours }} horas seguidas</b> en horario diurno (06:00–22:00) no uses redes sociales ni apps de ocio. Puedes cerrar GritAI y volver cuando termine el tiempo.</p>
          @if (!okWindow() && !demo()) { <p class="hint err">Para completar 6 h antes de las 22:00 debes iniciar entre las 6:00 y las 16:00 (ahora son las {{ nowStr() }}).</p> }
          <button class="btn xl block" [disabled]="!okWindow() && !demo()" (click)="start()"><ion-icon name="cloud-offline" /> Iniciar ayuno digital</button>
        </section>
      } @else {
        <section class="card grad grad-ocean center">
          <small class="op">TIEMPO RESTANTE</small>
          <div class="clk">{{ left() }}</div>
          <div class="bar on-dark"><i [style.width.%]="pct()"></i></div>
          <p class="small op" style="margin-top:8px">Iniciaste a las {{ startStr() }}. Puedes cerrar la app.</p>
        </section>
        <section class="card col">
          <label class="chk"><input type="checkbox" [(ngModel)]="declare" /> Declaro que no usé redes sociales ni apps de ocio durante este periodo.</label>
          <button class="btn green xl block" [disabled]="pct() < 100 || !declare" (click)="claim()">{{ pct() < 100 ? 'Aún no termina el tiempo' : 'Reclamar ' + ch.xp + ' XP' }}</button>
          <button class="btn ghost sm" (click)="abort()">Cancelar ayuno</button>
        </section>
      }
    }
  `,
  styles: [`.clk { font-size: 54px; font-weight: 900; font-variant-numeric: tabular-nums; margin: 4px 0 10px; } .op { opacity: .9; font-weight: 800; letter-spacing: 1.2px; font-size: 11px; } p.op { font-weight: 600; letter-spacing: 0; font-size: 13px; } .chk { display: flex; gap: 10px; align-items: flex-start; font-weight: 700; font-size: 14px; } .chk input { width: 22px; height: 22px; accent-color: var(--g-green); flex-shrink: 0; }`],
})
export class FastChallengeRunner implements OnInit, OnDestroy {
  private game = inject(GameStore);
  @Input({ required: true }) ch!: Challenge;
  @Output() complete = new EventEmitter<RunnerResult>();
  declare = false;
  now = signal(Date.now());
  private timer?: ReturnType<typeof setInterval>;
  demo = computed(() => this.game.demoSpeed());
  startedAt = computed(() => this.game.pendingOf(this.ch.id).startedAt ?? 0);
  started = computed(() => !!this.startedAt());
  private total = computed(() => (this.ch.v.t === 'fast' ? this.ch.v.hours * 3600 : 0));
  private elapsed = computed(() => ((this.now() - this.startedAt()) / 1000) * (this.demo() ? 360 : 1));
  pct = computed(() => Math.min(100, (this.elapsed() / this.total()) * 100));
  left = computed(() => fmtClock(Math.max(0, this.total() - this.elapsed())));
  startStr = computed(() => fmtTime(this.startedAt()));
  nowStr = computed(() => fmtTime(this.now()));
  okWindow = computed(() => {
    const h = new Date(this.now()).getHours();
    return h >= 6 && h < 16;
  });

  ngOnInit(): void { this.timer = setInterval(() => this.now.set(Date.now()), 1000); }
  ngOnDestroy(): void { clearInterval(this.timer); }
  start(): void { this.game.setPending(this.ch.id, { startedAt: Date.now() }); }
  abort(): void { this.game.clearPending(this.ch.id); this.declare = false; }
  claim(): void { this.complete.emit({ data: { startedAt: this.startedAt(), hours: this.ch.v.t === 'fast' ? this.ch.v.hours : 0, declared: true } }); }
}

/* ------------------------------------------------------------------ */
/* Higiene de sueño: bloqueo voluntario 10:30 PM – 6:30 AM              */
/* ------------------------------------------------------------------ */
@Component({
  selector: 'app-run-sleep',
  standalone: true,
  imports: [IonIcon],
  template: `
    @if (!locked()) {
      <section class="card col">
        <p class="small">Activa el bloqueo voluntario entre las <b>10:30 PM</b> y las <b>6:30 AM</b>. Mientras esté activo, la app muestra una pantalla de descanso y no se usa. Al amanecer reclamas tu XP.</p>
        @if (!okNow() && !demo()) { <p class="hint err">Solo puedes activarlo a partir de las 10:30 PM (ahora son las {{ nowStr() }}).</p> }
        <button class="btn xl block" [disabled]="!okNow() && !demo()" (click)="start()"><ion-icon name="moon" /> Activar bloqueo de sueño</button>
      </section>
    } @else if (!finished()) {
      <div class="night" role="dialog" aria-label="Bloqueo de sueño activo">
        <ion-icon name="moon" class="mn" />
        <h2>Descansa</h2>
        <p>El bloqueo termina a las 6:30 AM.</p>
        <div class="clk">{{ left() }}</div>
        <button class="btn ghost sm" (click)="abort()">Desbloquear (anula el reto)</button>
      </div>
    } @else {
      <section class="card grad grad-sunset center"><ion-icon name="sunny" style="font-size:48px" /><h2>¡Buenos días!</h2><p class="small" style="opacity:.92;margin:4px 0 12px">Dormiste sin usar la app durante toda la noche.</p>
        <button class="btn light" (click)="claim()">Reclamar {{ ch.xp }} XP</button></section>
    }
  `,
  styles: [`
    .night { position: fixed; inset: 0; z-index: 8500; background: radial-gradient(circle at 50% 25%, #312e81, #0b0a2e 75%); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; padding: 30px; }
    .mn { font-size: 72px; color: #fde68a; } .clk { font-size: 54px; font-weight: 900; font-variant-numeric: tabular-nums; }
  `],
})
export class SleepChallengeRunner implements OnInit, OnDestroy {
  private game = inject(GameStore);
  @Input({ required: true }) ch!: Challenge;
  @Output() complete = new EventEmitter<RunnerResult>();
  now = signal(Date.now());
  private timer?: ReturnType<typeof setInterval>;
  demo = computed(() => this.game.demoSpeed());
  startedAt = computed(() => this.game.pendingOf(this.ch.id).startedAt ?? 0);
  endsAt = computed(() => (this.game.pendingOf(this.ch.id)['endsAt'] as number | undefined) ?? 0);
  locked = computed(() => !!this.startedAt());
  finished = computed(() => this.locked() && this.now() >= this.endsAt());
  left = computed(() => fmtClock((this.endsAt() - this.now()) / 1000));
  nowStr = computed(() => fmtTime(this.now()));
  okNow = computed(() => {
    const d = new Date(this.now());
    const m = d.getHours() * 60 + d.getMinutes();
    return m >= 22 * 60 + 30; // desde las 10:30 PM (hasta medianoche)
  });

  ngOnInit(): void { this.timer = setInterval(() => this.now.set(Date.now()), 1000); }
  ngOnDestroy(): void { clearInterval(this.timer); }

  start(): void {
    const now = new Date();
    const end = new Date(now);
    end.setHours(6, 30, 0, 0);
    if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 1);
    const real = end.getTime() - now.getTime();
    const dur = this.demo() ? Math.min(real, 20000) : real; // demostración: 20 s
    this.game.setPending(this.ch.id, { startedAt: now.getTime(), endsAt: now.getTime() + dur });
  }

  abort(): void { this.game.clearPending(this.ch.id); }
  claim(): void { this.complete.emit({ data: { lockedFrom: this.startedAt(), lockedUntil: this.endsAt() } }); }
}

/* ------------------------------------------------------------------ */
/* Día difícil superado                                                 */
/* ------------------------------------------------------------------ */
@Component({
  selector: 'app-run-hardday',
  standalone: true,
  imports: [IonIcon],
  template: `
    @if (!marked()) {
      <section class="card col">
        <p class="small">¿Hoy te sientes cansado/a o sin energía? Márcalo y completa <b>al menos un reto</b> hoy. Eso demuestra que la constancia no depende de las ganas.</p>
        <button class="btn orange xl block" (click)="mark()"><ion-icon name="battery-half" /> Marcar hoy como día difícil</button>
      </section>
    } @else {
      <section class="card" [class.soft-green]="ok()" [class.soft-orange]="!ok()">
        <b><ion-icon [name]="ok() ? 'checkmark-circle' : 'hourglass'" /> {{ ok() ? 'Cumpliste tu meta en un día difícil' : 'Día difícil marcado' }}</b>
        <p class="small">{{ ok() ? 'Completaste un reto después de marcarlo. ¡Eso es GRIT!' : 'Ahora completa otro reto del nivel hoy (puede ser uno corto) y regresa aquí a reclamar.' }}</p>
      </section>
      <button class="btn green xl block" [disabled]="!ok()" (click)="claim()">{{ ok() ? 'Reclamar ' + ch.xp + ' XP' : 'Completa un reto hoy' }}</button>
    }
  `,
})
export class HardDayChallengeRunner {
  private game = inject(GameStore);
  @Input({ required: true }) ch!: Challenge;
  @Output() complete = new EventEmitter<RunnerResult>();
  private p = computed(() => this.game.pendingOf(this.ch.id));
  marked = computed(() => (this.p()['day'] as string | undefined) === this.game.today());
  ok = computed(() => {
    const at = (this.p()['markedAt'] as number | undefined) ?? 0;
    if (!this.marked()) return false;
    const c = this.game.state()?.completed ?? {};
    return Object.entries(c).some(([id, v]) => id !== this.ch.id && v.at >= at);
  });
  mark(): void { this.game.setPending(this.ch.id, { day: this.game.today(), markedAt: Date.now() }); }
  claim(): void { this.complete.emit({ data: { hardDay: this.game.today(), validatedBy: 'system' } }); }
}

/* ------------------------------------------------------------------ */
/* Mentoría verificada: confirmación de un compañero                    */
/* ------------------------------------------------------------------ */
@Component({
  selector: 'app-run-peer',
  standalone: true,
  imports: [FormsModule, IonIcon],
  template: `
    <section class="card col">
      <b>1. Cuéntanos tu mentoría</b>
      <div class="field"><label for="pn">Nombre de tu compañero/a mentor</label><input id="pn" class="input" [(ngModel)]="peer" /></div>
      <div class="field"><label for="pt">¿Qué acompañamiento recibiste?</label><textarea id="pt" class="textarea" rows="4" [(ngModel)]="text" placeholder="Qué aprendiste y cómo te ayudó…"></textarea></div>
      <span class="hint" [class.ok]="wc(text) >= 20">{{ wc(text) }} / 20 palabras mínimas</span>
    </section>
    <section class="card col" [class.off]="!step1()">
      <b>2. Confirmación del compañero</b>
      <p class="small muted">Pasa el dispositivo a tu compañero/a para que confirme el acompañamiento.</p>
      <div class="field"><label for="cn">Escribe tu nombre completo</label><input id="cn" class="input" [(ngModel)]="confirmName" [disabled]="!step1()" /></div>
      <label class="chk"><input type="checkbox" [(ngModel)]="confirmed" [disabled]="!step1()" /> Confirmo que acompañé a {{ name() }} en su proceso GRIT.</label>
    </section>
    <button class="btn green xl block" [disabled]="!ready()" (click)="submit()">Registrar mentoría verificada</button>
    <p class="xs muted center"><ion-icon name="information-circle-outline" /> La confirmación se registra en este dispositivo (sin servidor).</p>
  `,
  styles: [`.off { opacity: .55; } .chk { display: flex; gap: 10px; align-items: flex-start; font-weight: 700; font-size: 14px; } .chk input { width: 22px; height: 22px; accent-color: var(--g-green); flex-shrink: 0; }`],
})
export class PeerChallengeRunner {
  private game = inject(GameStore);
  @Input({ required: true }) ch!: Challenge;
  @Output() complete = new EventEmitter<RunnerResult>();
  peer = '';
  text = '';
  confirmName = '';
  confirmed = false;
  wc = countWords;
  name = () => this.game.name();
  step1 = () => countWords(this.peer) >= 1 && countWords(this.text) >= 20;
  ready = () => this.step1() && countWords(this.confirmName) >= 2 && this.confirmed;
  submit(): void {
    this.complete.emit({ data: { peer: this.peer, text: this.text, confirmedBy: this.confirmName, confirmedAt: Date.now() } });
  }
}

/* ------------------------------------------------------------------ */
/* Jornada impecable: planificador del día                              */
/* ------------------------------------------------------------------ */
interface PlanTask { t: string; done: boolean }

@Component({
  selector: 'app-run-planner',
  standalone: true,
  imports: [FormsModule, IonIcon],
  template: `
    @if (ch.v.t === 'planner') {
      <section class="card col">
        <p class="small">Planea tus tareas de hoy (mínimo {{ ch.v.minTasks }}) y complétalas <b>todas antes de que termine el día</b>, sin posponer ninguna. Una vez que empiezas a marcar, el plan queda cerrado.</p>
        @if (expired()) { <p class="hint err">Tu plan anterior no se cerró a tiempo. Se reinició para hoy.</p> }
      </section>
      <section class="card col">
        @for (t of tasks(); track $index; let i = $index) {
          <label class="tk" [class.done]="t.done"><input type="checkbox" [checked]="t.done" [disabled]="!locked()" (change)="toggle(i)" /> <span class="grow">{{ t.t }}</span>
            @if (!locked()) { <button type="button" class="x" (click)="remove(i)" aria-label="Quitar tarea"><ion-icon name="close" /></button> }
          </label>
        }
        @if (!locked()) {
          <div class="row"><input class="input" [(ngModel)]="newTask" placeholder="Nueva tarea de hoy…" (keyup.enter)="add()" maxlength="80" /><button class="btn sm" (click)="add()" [disabled]="!newTask.trim()">Añadir</button></div>
          <button class="btn ghost" [disabled]="tasks().length < ch.v.minTasks" (click)="lockPlan()">Cerrar plan ({{ tasks().length }}/{{ ch.v.minTasks }} tareas)</button>
        } @else {
          <span class="chip" [class.green]="allDone()">{{ doneCount() }} / {{ tasks().length }} completadas</span>
        }
      </section>
      <button class="btn green xl block" [disabled]="!allDone()" (click)="claim()">{{ allDone() ? 'Reclamar ' + ch.xp + ' XP' : 'Completa el 100% de tu plan' }}</button>
    }
  `,
  styles: [`.tk { display: flex; align-items: center; gap: 12px; font-weight: 700; padding: 6px 2px; } .tk input { width: 24px; height: 24px; accent-color: var(--g-green); } .tk.done span { text-decoration: line-through; color: var(--g-muted); } .x { background: none; border: 0; color: var(--g-muted); font-size: 22px; cursor: pointer; }`],
})
export class PlannerChallengeRunner implements OnInit {
  private game = inject(GameStore);
  @Input({ required: true }) ch!: Challenge;
  @Output() complete = new EventEmitter<RunnerResult>();
  newTask = '';
  expired = signal(false);
  tasks = computed<PlanTask[]>(() => (this.game.pendingOf(this.ch.id)['tasks'] as PlanTask[] | undefined) ?? []);
  locked = computed(() => !!this.game.pendingOf(this.ch.id)['locked']);
  doneCount = computed(() => this.tasks().filter((t) => t.done).length);
  allDone = computed(() => this.locked() && this.tasks().length > 0 && this.doneCount() === this.tasks().length);

  ngOnInit(): void {
    const p = this.game.pendingOf(this.ch.id);
    if (p['day'] && p['day'] !== dayStr()) {
      this.game.clearPending(this.ch.id);
      this.expired.set(true);
    }
  }

  private save(tasks: PlanTask[], locked = this.locked()): void {
    this.game.setPending(this.ch.id, { tasks, locked, day: dayStr() });
  }
  add(): void { if (this.newTask.trim()) { this.save([...this.tasks(), { t: this.newTask.trim(), done: false }]); this.newTask = ''; } }
  remove(i: number): void { this.save(this.tasks().filter((_, k) => k !== i)); }
  lockPlan(): void { this.save(this.tasks(), true); }
  toggle(i: number): void { this.save(this.tasks().map((t, k) => (k === i ? { ...t, done: !t.done } : t))); }
  claim(): void { this.complete.emit({ data: { tasks: this.tasks().map((t) => t.t), day: dayStr() } }); }
}
