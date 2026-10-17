import { Component, EventEmitter, HostListener, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import { GameStore } from '../core/game.store';
import { fmtClock } from '../core/util';
import { MascotComponent } from './mascot.component';

/** Respiración guiada 4-4-4. Con strict=true se anula si el usuario sale de la app o pausa. */
@Component({
  selector: 'app-breathing',
  standalone: true,
  imports: [MascotComponent],
  template: `
    <div class="br">
      @if (!running()) {
        <app-mascot mood="normal" [size]="110" [animated]="true" />
        <p class="small muted center">{{ intro }}</p>
        <button class="btn xl" (click)="start()">Comenzar ({{ minutes }} min)</button>
      } @else {
        <div class="orb" [class.in]="phase() === 0" [class.hold]="phase() === 1" [class.out]="phase() === 2">
          <app-mascot mood="happy" [size]="96" />
        </div>
        <h2>{{ labels[phase()] }}</h2>
        <p class="clock">{{ clock() }}</p>
        <div class="bar" style="width:100%"><i [style.width.%]="pct()"></i></div>
        @if (strict) { <p class="xs muted center">Sin pausar: si sales de la app, el ejercicio se anula.</p> }
      }
    </div>
  `,
  styles: [`
    .br { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 6px 0; }
    .orb { width: 190px; height: 190px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff, #d9ccff 70%); display: grid; place-items: center; box-shadow: 0 0 0 10px rgba(124,58,237,.12), 0 14px 40px rgba(91,52,214,.3); transition: transform 4s ease-in-out; transform: scale(.78); }
    .orb.in, .orb.hold { transform: scale(1.08); } .orb.out { transform: scale(.78); }
    h2 { font-size: 26px; } .clock { font-size: 34px; font-weight: 900; font-variant-numeric: tabular-nums; color: var(--g-purple); }
  `],
})
export class BreathingComponent implements OnDestroy {
  private game = inject(GameStore);
  @Input() minutes = 3;
  @Input() strict = false;
  @Input() intro = 'Siéntate cómodo, relaja los hombros y sigue el ritmo: inhala 4, sostén 4, exhala 4.';
  @Output() done = new EventEmitter<void>();
  @Output() failed = new EventEmitter<void>();

  labels = ['Inhala…', 'Sostén…', 'Exhala…'];
  running = signal(false);
  phase = signal(0);
  clock = signal('');
  pct = signal(0);
  private t0 = 0;
  private timer?: ReturnType<typeof setInterval>;

  start(): void {
    this.running.set(true);
    this.t0 = Date.now();
    this.tick();
    this.timer = setInterval(() => this.tick(), 200);
  }

  private tick(): void {
    const speed = this.game.demoSpeed() ? 60 : 1;
    const real = Date.now() - this.t0;
    const total = this.minutes * 60;
    const elapsed = (real / 1000) * speed;
    this.phase.set(Math.floor(real / 4000) % 3);
    this.clock.set(fmtClock(total - elapsed));
    this.pct.set(Math.min(100, (elapsed / total) * 100));
    if (elapsed >= total) {
      clearInterval(this.timer);
      this.running.set(false);
      this.done.emit();
    }
  }

  @HostListener('document:visibilitychange')
  onVis(): void {
    if (this.strict && this.running() && document.visibilityState === 'hidden') {
      clearInterval(this.timer);
      this.running.set(false);
      this.failed.emit();
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
