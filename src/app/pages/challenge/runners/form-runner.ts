import { Component, EventEmitter, Input, OnInit, Output, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular';
import { Challenge, Field } from '../../../core/challenges.data';
import { GameStore } from '../../../core/game.store';
import { countWords, fmtTime } from '../../../core/util';
import { RunnerResult } from './runner';

/** Cubre los retos tipo "text" y "checkin" (con texto opcional y ventana horaria) */
@Component({
  selector: 'app-run-form',
  standalone: true,
  imports: [FormsModule, IonIcon],
  template: `
    @if (before(); as b) {
      <section class="card" [class.soft-green]="inWindow()" [class.soft-red]="!inWindow()">
        <b><ion-icon [name]="inWindow() ? 'time' : 'alarm'" /> {{ inWindow() ? 'Estás a tiempo' : 'Fuera de horario' }}</b>
        <p class="small">Este check-in solo cuenta antes de las {{ label(b) }}. Hora actual: {{ nowStr }}.
          @if (!inWindow() && demo()) { <br /><i>Modo demostración: horario ignorado.</i> }</p>
      </section>
    }
    @for (f of fields(); track f.key) {
      <section class="card col">
        <div class="field">
          <label [for]="f.key">{{ f.label }}</label>
          <textarea [id]="f.key" class="textarea" [rows]="f.rows ?? 4" [placeholder]="f.hint ?? 'Escribe aquí…'" [ngModel]="vals[f.key]" (ngModelChange)="vals[f.key] = $event" maxlength="4000"></textarea>
        </div>
        @if (f.minWords) {
          <div class="row between"><span class="hint" [class.ok]="words(f) >= f.minWords">{{ words(f) }} / {{ f.minWords }} palabras mínimas</span>
            @if (words(f) >= f.minWords) { <ion-icon name="checkmark-circle" class="okc" /> }</div>
          <div class="bar" [class.green]="words(f) >= f.minWords"><i [style.width.%]="Math.min(100, (words(f) / f.minWords) * 100)"></i></div>
        }
      </section>
    }
    <button class="btn green xl block" [disabled]="!valid()" (click)="submit()">{{ confirmLabel() }}</button>
    @if (!valid()) { <p class="hint center">{{ blockReason() }}</p> }
  `,
  styles: [`.okc { color: var(--g-green); font-size: 22px; }`],
})
export class FormChallengeRunner implements OnInit {
  private game = inject(GameStore);
  @Input({ required: true }) ch!: Challenge;
  @Output() complete = new EventEmitter<RunnerResult>();
  Math = Math;
  vals: Record<string, string> = {};
  nowStr = fmtTime(Date.now());

  demo = computed(() => this.game.demoSpeed());
  fields = computed<Field[]>(() => (this.ch.v.t === 'text' || this.ch.v.t === 'checkin' ? (this.ch.v.t === 'text' ? this.ch.v.fields : this.ch.v.fields ?? []) : []));
  before = computed(() => (this.ch.v.t === 'checkin' ? this.ch.v.before ?? null : null));
  confirmLabel = computed(() => (this.ch.v.t === 'checkin' ? this.ch.v.confirmLabel : 'Enviar reto'));

  ngOnInit(): void {
    this.nowStr = fmtTime(Date.now());
  }

  label(b: { h: number; m: number }): string {
    const h12 = b.h % 12 === 0 ? 12 : b.h % 12;
    return `${h12}:${String(b.m).padStart(2, '0')} ${b.h < 12 ? 'AM' : b.h === 12 && b.m === 0 ? 'PM (mediodía)' : 'PM'}`;
  }

  inWindow(): boolean {
    const b = this.before();
    if (!b) return true;
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes() < b.h * 60 + b.m;
  }

  words(f: Field): number {
    return countWords(this.vals[f.key] ?? '');
  }

  valid(): boolean {
    if (this.before() && !this.inWindow() && !this.demo()) return false;
    return this.fields().every((f) => this.words(f) >= (f.minWords ?? 1));
  }

  blockReason(): string {
    if (this.before() && !this.inWindow() && !this.demo()) return 'El horario de este check-in ya pasó. Inténtalo mañana temprano.';
    return 'Completa los campos con la extensión mínima indicada.';
  }

  submit(): void {
    this.complete.emit({ data: { ...this.vals, checkedInAt: Date.now() } });
  }
}
