import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonContent, IonIcon } from '@ionic/angular';
import { Seg } from '../../core/challenges.data';
import { GameStore } from '../../core/game.store';
import { MascotComponent } from '../../shared/mascot.component';
import { TimerResult, TimerRunnerComponent } from '../../shared/timer-runner.component';

type Mode = 1 | 2 | 3 | 4 | 'custom';

@Component({
  selector: 'app-focus',
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, MascotComponent, TimerRunnerComponent],
  template: `
    <ion-content class="page">
      <div class="fz wrap-tabs" [class.run]="tr?.started()">
        <header class="hd">
          <app-mascot [mood]="tr?.started() ? 'happy' : 'normal'" [size]="86" [animated]="true" />
          <h1>Modo Enfoque</h1>
          <p>Concéntrate. Tu futuro te está esperando.</p>
        </header>

        @if (!tr?.started()) {
          <div class="field">
            <label for="task">¿En qué te vas a enfocar?</label>
            <input id="task" class="input" [(ngModel)]="task" placeholder="Ej. Leer capítulo 3 de química…" maxlength="80" />
          </div>
          <div class="modes" role="tablist" aria-label="Número de bloques Pomodoro">
            @for (m of modes; track m.v) {
              <button role="tab" [attr.aria-selected]="mode() === m.v" [class.on]="mode() === m.v" (click)="setMode(m.v)">{{ m.l }}</button>
            }
          </div>
          <p class="xs center plan">{{ planText() }}</p>
          @if (mode() === 'custom') {
            <div class="grid2 custom">
              <div class="card col center"><b class="small">Duración de sesión</b><span class="n">{{ workLen() }}</span><div class="row" style="justify-content:center"><button class="icon-btn" (click)="adj('w', 5)" aria-label="Sumar 5 minutos a la sesión"><ion-icon name="arrow-up" /></button><button class="icon-btn" (click)="adj('w', -5)" aria-label="Restar 5 minutos a la sesión"><ion-icon name="arrow-down" /></button></div></div>
              <div class="card col center"><b class="small">Duración de descanso</b><span class="n">{{ breakLen() }}</span><div class="row" style="justify-content:center"><button class="icon-btn" (click)="adj('b', 1)" aria-label="Sumar 1 minuto al descanso"><ion-icon name="arrow-up" /></button><button class="icon-btn" (click)="adj('b', -1)" aria-label="Restar 1 minuto al descanso"><ion-icon name="arrow-down" /></button></div></div>
            </div>
          }
          <div class="opts">
            <label class="sw"><input type="checkbox" [ngModel]="shortBreak()" (ngModelChange)="shortBreak.set($event)" /> Descanso corto (5 min)</label>
            <label class="sw"><input type="checkbox" [ngModel]="longBreak()" (ngModelChange)="longBreak.set($event)" /> Descanso largo ({{ mode() === 4 ? 30 : 15 }} min)</label>
          </div>
        } @else if (task) {
          <p class="center bold task">{{ task }}</p>
        }

        <app-timer-runner #tr [segs]="segs()" mode="pause" (workDone)="onWork($event)" (completed)="onDone($event)" />

        <div class="stats">
          <div><b>{{ game.state()?.focusSessions ?? 0 }}</b><span>Sesiones</span></div>
          <div><b>{{ hours() }}</b><span>Horas de enfoque</span></div>
        </div>
        @if (done()) { <div class="card soft-green pop center"><b>¡Sesión terminada!</b><p class="small">Registraste {{ done()!.workMinutes }} min de enfoque. Descansa y vuelve por más.</p></div> }
        <p class="xs muted center">Al salir de la app el temporizador se pausa. Los bloques de 25 min siempre se retoman tras el descanso.</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .fz { padding: 24px 20px 110px; display: flex; flex-direction: column; gap: 16px; min-height: 100%; }
    .hd { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px; } h1 { font-size: 28px; } .hd p { color: var(--g-muted); font-weight: 700; }
    .modes { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; } .modes button { border: 2px solid #e3d6ff; background: #fff; color: var(--g-purple); font: inherit; font-weight: 800; padding: 9px 16px; border-radius: 999px; cursor: pointer; } .modes button.on { background: var(--g-grad-brand); color: #fff; border-color: transparent; box-shadow: 0 6px 14px rgba(91,52,214,.3); }
    .plan { color: var(--g-muted); font-weight: 700; } .n { font-size: 40px; font-weight: 900; line-height: 1; }
    .opts { display: flex; flex-direction: column; gap: 6px; padding: 0 6px; } .sw { display: flex; gap: 10px; align-items: center; font-weight: 700; font-size: 14px; } .sw input { width: 20px; height: 20px; accent-color: var(--g-purple); }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } .stats div { background: #fff; border-radius: 20px; padding: 12px; text-align: center; box-shadow: var(--g-shadow-sm); display: flex; flex-direction: column; } .stats b { font-size: 26px; } .stats span { font-size: 12px; color: var(--g-muted); font-weight: 700; }
    .task { font-size: 18px; }
  `],
})
export class FocusPage {
  game = inject(GameStore);
  private route = inject(ActivatedRoute);
  @ViewChild('tr') tr?: TimerRunnerComponent;

  task = '';
  modes: { v: Mode; l: string }[] = [{ v: 1, l: '1 bloque' }, { v: 2, l: '2 bloques' }, { v: 3, l: '3 bloques' }, { v: 4, l: '4 bloques' }, { v: 'custom', l: 'Personalizado' }];
  mode = signal<Mode>(1);
  workLen = signal(25);
  breakLen = signal(5);
  shortBreak = signal(true);
  longBreak = signal(true);
  onlyBreak = signal(0);
  done = signal<TimerResult | null>(null);

  segs = computed<Seg[]>(() => {
    if (this.onlyBreak()) return [{ k: 'break', m: this.onlyBreak() }];
    const m = this.mode();
    const n = m === 'custom' ? 1 : m;
    const w = m === 'custom' ? this.workLen() : 25;
    const sb = m === 'custom' ? this.breakLen() : 5;
    const lb = m === 'custom' ? this.breakLen() * 3 : n === 4 ? 30 : 15;
    const out: Seg[] = [];
    for (let i = 1; i <= n; i++) {
      out.push({ k: 'work', m: w });
      if (i < n && this.shortBreak()) out.push({ k: 'break', m: sb });
      if (i === n && this.longBreak()) out.push({ k: 'break', m: lb });
    }
    return out;
  });

  planText = computed(() => {
    const s = this.segs();
    const total = s.reduce((a, x) => a + x.m, 0);
    const work = s.filter((x) => x.k === 'work').reduce((a, x) => a + x.m, 0);
    return this.onlyBreak() ? `Descanso de ${this.onlyBreak()} min` : `${work} min de enfoque · ${total} min en total`;
  });

  hours = computed(() => ((this.game.state()?.focusMinutes ?? 0) / 60).toFixed(1));

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((p) => {
      const w = Number(p.get('work'));
      const b = Number(p.get('break'));
      this.onlyBreak.set(0);
      if (w > 0) {
        this.mode.set('custom');
        this.workLen.set(Math.min(120, w));
        this.shortBreak.set(false);
        this.longBreak.set(false);
      } else if (b > 0) {
        this.onlyBreak.set(Math.min(60, b));
      }
    });
  }

  setMode(m: Mode): void {
    this.onlyBreak.set(0);
    this.mode.set(m);
    this.done.set(null);
  }

  adj(k: 'w' | 'b', d: number): void {
    if (k === 'w') this.workLen.update((v) => Math.min(120, Math.max(5, v + d)));
    else this.breakLen.update((v) => Math.min(30, Math.max(1, v + d)));
  }

  onWork(min: number): void {
    this.game.logFocusSession(min);
  }

  onDone(r: TimerResult): void {
    this.done.set(r);
  }
}
