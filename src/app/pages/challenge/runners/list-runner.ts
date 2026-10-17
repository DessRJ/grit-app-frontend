import { Component, EventEmitter, Input, OnInit, Output, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Challenge, Field } from '../../../core/challenges.data';
import { countWords, dayStr } from '../../../core/util';
import { GameStore } from '../../../core/game.store';
import { RunnerResult } from './runner';

/** Retos tipo "list" (subtareas / consejos) y "table" (bitácora, auditoría de tiempo) */
@Component({
  selector: 'app-run-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (ch.v.t === 'list') {
      @if (ch.v.mainLabel) {
        <section class="card field"><label for="main">{{ ch.v.mainLabel }}</label><input id="main" class="input" [(ngModel)]="main" placeholder="¿Qué vas a lograr?" /></section>
      }
      @for (i of idx(); track i) {
        <section class="card col">
          <div class="field"><label [for]="'it' + i">{{ ch.v.itemLabel }} {{ i + 1 }}</label>
            <input [id]="'it' + i" class="input" [(ngModel)]="items[i]" placeholder="Escribe aquí…" /></div>
          @if (ch.v.checkable) { <label class="chk"><input type="checkbox" [(ngModel)]="checks[i]" /> Completada</label> }
          @if (ch.v.minWordsEach) { <span class="hint" [class.ok]="wc(items[i]) >= ch.v.minWordsEach">{{ wc(items[i]) }} / {{ ch.v.minWordsEach }} palabras mínimas</span> }
        </section>
      }
    } @else if (ch.v.t === 'table') {
      @for (i of idx(); track i) {
        <section class="card col">
          <b>{{ ch.v.rowLabel }} {{ i + 1 }}</b>
          @for (c of ch.v.cols; track c.key) {
            <div class="field"><label [for]="c.key + i">{{ c.label }}</label>
              <input [id]="c.key + i" class="input" [type]="c.kind === 'number' ? 'number' : 'text'" [attr.min]="c.kind === 'number' ? 1 : null" [inputMode]="c.kind === 'number' ? 'numeric' : 'text'" [(ngModel)]="cells[i][c.key]" /></div>
          }
          @if (hasNums()) { <span class="chip" [class.green]="diff(i) !== null">{{ diffText(i) }}</span> }
        </section>
      }
    }
    <button class="btn green xl block" [disabled]="!valid()" (click)="submit()">Enviar reto</button>
    @if (!valid()) { <p class="hint center">{{ reason() }}</p> }
  `,
  styles: [`.chk { display: flex; gap: 10px; align-items: center; font-weight: 800; } .chk input { width: 22px; height: 22px; accent-color: var(--g-green); }`],
})
export class ListChallengeRunner implements OnInit {
  @Input({ required: true }) ch!: Challenge;
  @Output() complete = new EventEmitter<RunnerResult>();
  main = '';
  items: string[] = [];
  checks: boolean[] = [];
  cells: Record<string, string>[] = [];
  private game = inject(GameStore);

  count = computed(() => (this.ch.v.t === 'list' ? this.ch.v.count : this.ch.v.t === 'table' ? this.ch.v.rows : 0));
  idx = computed(() => Array.from({ length: this.count() }, (_, i) => i));

  ngOnInit(): void {
    this.items = Array(this.count()).fill('');
    this.checks = Array(this.count()).fill(false);
    this.cells = Array.from({ length: this.count() }, () => ({}));
  }

  wc = countWords;

  hasNums(): boolean {
    return this.ch.v.t === 'table' && this.ch.v.cols.some((c) => c.kind === 'number');
  }

  private num(i: number, key: string): number {
    return Number(this.cells[i]?.[key] ?? NaN);
  }

  diff(i: number): number | null {
    if (this.ch.v.t !== 'table') return null;
    const nums = this.ch.v.cols.filter((c: Field) => c.kind === 'number');
    if (nums.length < 2) return null;
    const a = this.num(i, nums[0].key);
    const b = this.num(i, nums[1].key);
    return a > 0 && b > 0 ? b - a : null;
  }

  diffText(i: number): string {
    const d = this.diff(i);
    if (d === null) return 'Diferencia: —';
    return d === 0 ? 'Estimaste exacto' : d > 0 ? `Tardaste ${d} min más de lo estimado` : `Ahorraste ${-d} min`;
  }

  valid(): boolean {
    return !this.reason();
  }

  reason(): string {
    const v = this.ch.v;
    if (v.t === 'list') {
      if (v.mainLabel && countWords(this.main) < 2) return `Escribe la ${v.mainLabel.toLowerCase()}.`;
      for (let i = 0; i < v.count; i++) {
        if (countWords(this.items[i]) < (v.minWordsEach ?? 2)) return `Completa el campo «${v.itemLabel} ${i + 1}»${v.minWordsEach ? ` (mín. ${v.minWordsEach} palabras)` : ''}.`;
        if (v.checkable && !this.checks[i]) return `Marca como completada la ${v.itemLabel.toLowerCase()} ${i + 1}.`;
      }
      return '';
    }
    if (v.t === 'table') {
      for (let i = 0; i < v.rows; i++)
        for (const c of v.cols) {
          const val = (this.cells[i]?.[c.key] ?? '').toString();
          if (c.kind === 'number') {
            if (!(Number(val) > 0)) return `Indica un número válido en «${c.label}» (${v.rowLabel} ${i + 1}).`;
          } else if (countWords(val) < (c.minWords ?? 1)) return `Completa «${c.label}» (${v.rowLabel} ${i + 1}).`;
        }
    }
    return '';
  }

  submit(): void {
    const v = this.ch.v;
    if (v.t === 'list') this.complete.emit({ data: { main: this.main, items: this.items } });
    else this.complete.emit({ data: { rows: this.cells, on: dayStr() } });
  }
}
