import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { Challenge } from '../../../core/challenges.data';
import { GameStore } from '../../../core/game.store';
import { BreathingComponent } from '../../../shared/breathing.component';
import { TimerResult, TimerRunnerComponent } from '../../../shared/timer-runner.component';
import { RunnerResult } from './runner';

@Component({
  selector: 'app-run-timer',
  standalone: true,
  imports: [TimerRunnerComponent, BreathingComponent, IonIcon],
  template: `
    @if (failMsg()) {
      <div class="card soft-red col pop">
        <b><ion-icon name="close-circle" /> Reto anulado</b>
        <p class="small">{{ failMsg() }}</p>
        <button class="btn" (click)="retry()">Intentar de nuevo</button>
      </div>
    } @else {
      @if (ch.v.t === 'timer') {
        @for (k of [key()]; track k) {
          <app-timer-runner [segs]="ch.v.segs" mode="strict" [note]="ch.v.note ?? ''" (workDone)="onWork($event)" (completed)="done($event)" (failed)="failMsg.set($event)" />
        }
      } @else if (ch.v.t === 'breathing') {
        @for (k of [key()]; track k) {
          <app-breathing [minutes]="ch.v.minutes" [strict]="true" (done)="doneB()" (failed)="failMsg.set('Saliste de la app durante la respiración; el ejercicio se anula.')" />
        }
      }
    }
  `,
})
export class TimerChallengeRunner {
  private game = inject(GameStore);
  @Input({ required: true }) ch!: Challenge;
  @Output() complete = new EventEmitter<RunnerResult>();
  failMsg = signal('');
  key = signal(0);

  retry(): void {
    this.failMsg.set('');
    this.key.update((k) => k + 1);
  }

  onWork(min: number): void {
    this.game.logFocusSession(min);
  }

  done(r: TimerResult): void {
    this.complete.emit({ data: { workMinutes: r.workMinutes, blocks: r.workBlocks, deliverables: r.deliverables } });
  }

  doneB(): void {
    this.complete.emit({ data: { breathingMinutes: this.ch.v.t === 'breathing' ? this.ch.v.minutes : 0 } });
  }
}
