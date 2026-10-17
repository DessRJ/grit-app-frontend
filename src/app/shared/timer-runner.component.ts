import { Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular';
import { Seg } from '../core/challenges.data';
import { GameStore } from '../core/game.store';
import { countWords, fmtClock } from '../core/util';

export interface TimerResult {
  workBlocks: number;
  workMinutes: number;
  deliverables: string[];
}

/**
 * Temporizador por segmentos (trabajo / descanso) basado en marcas de tiempo (no se
 * desfasa aunque el navegador reduzca la frecuencia de los timers).
 *  - mode "strict": si el usuario cambia de pantalla/app el reto FALLA (manual de retos).
 *  - mode "pause": al salir de la app el temporizador se PAUSA (modo enfoque libre).
 */
@Component({
  selector: 'app-timer-runner',
  standalone: true,
  imports: [FormsModule, IonIcon],
  template: `
    <div class="tr" [class.brk]="seg().k === 'break'">
      <div class="ring" [class.pulse]="running()">
        <svg viewBox="0 0 220 220" aria-hidden="true">
          <circle cx="110" cy="110" r="98" class="bg" />
          <circle cx="110" cy="110" r="98" class="fg" [style.stroke-dashoffset]="dash()" />
        </svg>
        <div class="in">
          <small>{{ label() }}</small>
          <b class="clk" aria-live="off">{{ clock() }}</b>
          @if (segs.length > 1) { <small>Tramo {{ idx() + 1 }} de {{ segs.length }}</small> }
        </div>
      </div>

      @if (note) { <p class="small muted center">{{ note }}</p> }

      @if (paused()) {
        <div class="card soft-orange small"><b>Pausado.</b> Saliste de la aplicación; el tiempo no avanzó. Continúa cuando estés listo.</div>
      }

      @if (needDeliver()) {
        <div class="card col deliver">
          <b>Entregable del bloque {{ deliverables().length + 1 }}</b>
          <p class="small muted">Registra lo que lograste en esta hora (mín. 5 palabras) para continuar.</p>
          <textarea class="textarea" rows="3" [(ngModel)]="deliverText" placeholder="Ej. Terminé el resumen del capítulo 3…"></textarea>
          <button class="btn block" [disabled]="words(deliverText) < 5" (click)="submitDeliverable()">Guardar y continuar</button>
        </div>
      } @else {
        <div class="ctrl">
          @if (!started()) {
            <button class="btn xl" (click)="start()"><ion-icon name="play" /> Iniciar</button>
          } @else if (paused()) {
            <button class="btn xl" (click)="resume()"><ion-icon name="play" /> Reanudar</button>
          } @else if (mode === 'pause') {
            <button class="btn ghost" (click)="pauseManual()"><ion-icon name="pause" /> Pausar</button>
            @if (seg().k === 'break') { <button class="btn ghost" (click)="skip()">Saltar descanso</button> }
          }
          @if (started()) { <button class="btn ghost" (click)="cancel()"><ion-icon name="refresh" /> {{ mode === 'strict' ? 'Abandonar' : 'Reiniciar' }}</button> }
        </div>
      }

      @if (mode === 'strict' && !started()) {
        <p class="xs muted center"><ion-icon name="alert-circle-outline" /> Mantén esta pantalla abierta: si cambias de app, el reto se anula.</p>
      }
    </div>

    @if (started() && seg().k === 'break' && seg().locked) {
      <div class="lock" role="dialog" aria-label="Pantalla bloqueada de descanso">
        <ion-icon name="lock-closed" />
        <h2>Pausa activa</h2>
        <p>Estira, camina, toma agua. La pantalla está bloqueada hasta que termine el descanso.</p>
        <b class="clk big">{{ clock() }}</b>
        <button class="btn ghost sm" (click)="cancel()">Abandonar (se anula)</button>
      </div>
    }
  `,
  styles: [`
    .tr { display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .ring { position: relative; width: 250px; height: 250px; display: grid; place-items: center; border-radius: 50%; } .ring.pulse { animation: pulseRing 2.4s ease-out infinite; }
    svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
    .bg { fill: rgba(124,58,237,.06); stroke: #e5defa; stroke-width: 12; } .fg { fill: none; stroke-width: 12; stroke-linecap: round; stroke-dasharray: 615.75; transition: stroke-dashoffset .4s linear; stroke: var(--g-purple); }
    .brk .fg { stroke: var(--g-green); }
    .in { display: flex; flex-direction: column; align-items: center; gap: 2px; z-index: 1; } .in small { font-weight: 800; color: var(--g-muted); font-size: 13px; }
    .clk { font-size: 52px; font-weight: 900; font-variant-numeric: tabular-nums; letter-spacing: -1px; line-height: 1.1; } .clk.big { font-size: 64px; }
    .ctrl { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; } .deliver { width: 100%; }
    .lock { position: fixed; inset: 0; z-index: 8500; background: linear-gradient(160deg,#1e1b6b,#0f766e); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; padding: 30px; }
    .lock ion-icon { font-size: 54px; } .lock p { max-width: 300px; opacity: .9; font-weight: 600; }
  `],
})
export class TimerRunnerComponent implements OnChanges, OnDestroy {
  private game = inject(GameStore);
  @Input() segs: Seg[] = [{ k: 'work', m: 25 }];
  @Input() mode: 'strict' | 'pause' = 'strict';
  @Input() note = '';
  @Output() completed = new EventEmitter<TimerResult>();
  @Output() failed = new EventEmitter<string>();
  /** Se emite al terminar cada tramo de trabajo (para registrar sesiones de enfoque) */
  @Output() workDone = new EventEmitter<number>();
  @Output() brokeStart = new EventEmitter<void>();

  idx = signal(0);
  started = signal(false);
  paused = signal(false);
  running = computed(() => this.started() && !this.paused() && !this.needDeliver());
  needDeliver = signal(false);
  deliverables = signal<string[]>([]);
  deliverText = '';
  private elapsedMs = signal(0); // virtual
  private lastTick = 0;
  private timer?: ReturnType<typeof setInterval>;
  private workBlocks = 0;
  private workMinutes = 0;
  private wake: { release: () => Promise<void> } | null = null;

  seg = computed(() => this.segs[this.idx()]);
  private totalMs = computed(() => (this.seg().m ?? 0) * 60000);
  private remainingMs = computed(() => Math.max(0, this.totalMs() - this.elapsedMs()));
  clock = computed(() => fmtClock(this.remainingMs() / 1000));
  dash = computed(() => 615.75 * (1 - (this.totalMs() ? this.elapsedMs() / this.totalMs() : 0)));
  label = computed(() => (this.seg().k === 'break' ? 'Descanso' : this.segs.filter((s) => s.k === 'work').length > 1 ? 'Bloque de trabajo' : 'Sesión'));

  words = countWords;

  ngOnChanges(c: SimpleChanges): void {
    if (c['segs'] && !c['segs'].firstChange && !this.started()) this.reset();
  }

  start(): void {
    this.started.set(true);
    this.paused.set(false);
    this.lastTick = Date.now();
    this.timer = setInterval(() => this.tick(), 250);
    void this.lock();
  }

  private async lock(): Promise<void> {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
      this.wake = (await nav.wakeLock?.request('screen')) ?? null;
    } catch { /* no soportado */ }
  }

  private unlock(): void {
    void this.wake?.release().catch(() => undefined);
    this.wake = null;
  }

  private tick(): void {
    const now = Date.now();
    if (this.paused() || this.needDeliver()) {
      this.lastTick = now;
      return;
    }
    const speed = this.game.demoSpeed() ? 60 : 1;
    this.elapsedMs.update((v) => v + (now - this.lastTick) * speed);
    this.lastTick = now;
    if (this.elapsedMs() >= this.totalMs()) this.finishSegment();
  }

  private finishSegment(): void {
    const s = this.seg();
    this.beep();
    if (s.k === 'work') {
      this.workBlocks++;
      this.workMinutes += s.m;
      this.workDone.emit(s.m);
      if (s.deliver) {
        this.needDeliver.set(true);
        return;
      }
    }
    this.advance();
  }

  submitDeliverable(): void {
    this.deliverables.update((d) => [...d, this.deliverText.trim()]);
    this.deliverText = '';
    this.needDeliver.set(false);
    this.lastTick = Date.now();
    this.advance();
  }

  private advance(): void {
    if (this.idx() >= this.segs.length - 1) {
      this.stop();
      this.completed.emit({ workBlocks: this.workBlocks, workMinutes: this.workMinutes, deliverables: this.deliverables() });
      return;
    }
    this.idx.update((i) => i + 1);
    this.elapsedMs.set(0);
    this.lastTick = Date.now();
    if (this.seg().k === 'break') this.brokeStart.emit();
  }

  skip(): void {
    if (this.seg().k === 'break') this.advance();
  }

  pauseManual(): void {
    this.paused.set(true);
  }

  resume(): void {
    this.lastTick = Date.now();
    this.paused.set(false);
  }

  cancel(): void {
    const wasStrict = this.mode === 'strict';
    this.stop();
    if (wasStrict) this.failed.emit('Abandonaste el temporizador; el reto se anula.');
    else this.reset();
  }

  private stop(): void {
    clearInterval(this.timer);
    this.started.set(false);
    this.unlock();
  }

  private reset(): void {
    this.stop();
    this.idx.set(0);
    this.elapsedMs.set(0);
    this.paused.set(false);
    this.needDeliver.set(false);
    this.deliverables.set([]);
    this.workBlocks = 0;
    this.workMinutes = 0;
  }

  @HostListener('document:visibilitychange')
  onVisibility(): void {
    if (!this.started() || document.visibilityState !== 'hidden') return;
    const s = this.seg();
    if (this.mode === 'strict' && !this.needDeliver()) {
      this.stop();
      this.failed.emit(s?.k === 'break' ? 'Saliste de la app durante el descanso; el reto se anula.' : 'Cambiaste de pantalla o de app; el reto se anula.');
    } else if (this.mode === 'pause') {
      this.paused.set(true);
    }
  }

  private beep(): void {
    if (!this.game.state()?.settings.sound) return;
    try {
      navigator.vibrate?.([180, 80, 180]);
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      [660, 880].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        g.gain.value = 0.08;
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.18);
        o.stop(ctx.currentTime + i * 0.18 + 0.16);
      });
      setTimeout(() => void ctx.close(), 800);
    } catch { /* sin audio */ }
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
