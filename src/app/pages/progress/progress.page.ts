import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { CHALLENGES } from '../../core/challenges.data';
import { GameStore } from '../../core/game.store';
import { MOODS, MoodService } from '../../core/mood.service';
import { addDays, dayStr, fmtDate, longestStreak } from '../../core/util';
import { HeaderComponent } from '../../shared/header.component';
import { MascotComponent } from '../../shared/mascot.component';

interface Pt { day: string; label: string; xp: number; mood: number | null; x: number; yXp: number; yMood: number | null }

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [IonContent, DecimalPipe, HeaderComponent, MascotComponent],
  template: `
    <app-header title="Mi progreso" subtitle="Tu evolución en GritAI" />
    <ion-content class="page">
      <div class="wrap">
        <div class="grid3">
          <div class="kpi" style="background:var(--g-grad-brand)"><b>{{ game.level().level }}</b><span>Nivel</span></div>
          <div class="kpi" style="background:var(--g-grad-sunset)"><b>{{ game.completedCount() }}</b><span>Retos</span></div>
          <div class="kpi" style="background:var(--g-grad-fresh)"><b>{{ game.state()?.focusSessions ?? 0 }}</b><span>Sesiones</span></div>
        </div>

        <div class="seg" role="tablist">
          <button role="tab" [class.on]="tab() === 'week'" (click)="tab.set('week')">Semanal</button>
          <button role="tab" [class.on]="tab() === 'stats'" (click)="tab.set('stats')">Estadísticas</button>
        </div>

        @if (tab() === 'week') {
          <section class="card">
            <div class="row between"><b>XP {{ range() === 7 ? 'esta semana' : 'en 30 días' }}</b>
              <div class="mini"><button [class.on]="range() === 7" (click)="range.set(7)">7 d</button><button [class.on]="range() === 30" (click)="range.set(30)">30 d</button></div></div>
            <svg viewBox="0 0 320 170" class="chart" role="img" [attr.aria-label]="'Gráfica de XP de los últimos ' + range() + ' días'">
              <defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c3aed" stop-opacity=".28" /><stop offset="1" stop-color="#7c3aed" stop-opacity="0" /></linearGradient></defs>
              @for (g of grid(); track g.y) { <line x1="34" [attr.y1]="g.y" x2="312" [attr.y2]="g.y" stroke="#ece8fb" /><text x="28" [attr.y]="g.y + 4" text-anchor="end" class="ax">{{ g.v }}</text> }
              <path [attr.d]="area()" fill="url(#ar)" />
              <path [attr.d]="line()" fill="none" stroke="#7c3aed" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              @for (p of pts(); track p.day) { <circle [attr.cx]="p.x" [attr.cy]="p.yXp" r="3.6" fill="#fff" stroke="#7c3aed" stroke-width="2.2" /> }
              @for (p of labels(); track p.day) { <text [attr.x]="p.x" y="164" text-anchor="middle" class="ax">{{ p.label }}</text> }
            </svg>
            <p class="xs muted center">Total del periodo: <b>{{ total() | number }} XP</b></p>
          </section>

          <section class="card">
            <b>Estado emocional vs productividad</b>
            <svg viewBox="0 0 320 170" class="chart" role="img" aria-label="Barras de XP por día y línea de estado de ánimo">
              @for (p of pts(); track p.day) { <rect [attr.x]="p.x - barW() / 2" [attr.y]="p.yXp" [attr.width]="barW()" [attr.height]="140 - p.yXp + 10" rx="4" fill="#fb923c" opacity=".85" /> }
              <path [attr.d]="moodLine()" fill="none" stroke="#2563eb" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="1 0" />
              @for (p of pts(); track p.day) { @if (p.yMood !== null) { <circle [attr.cx]="p.x" [attr.cy]="p.yMood" r="3.4" fill="#2563eb" /> } }
              @for (p of labels(); track p.day) { <text [attr.x]="p.x" y="164" text-anchor="middle" class="ax">{{ p.label }}</text> }
            </svg>
            <div class="row legend"><span><i style="background:#fb923c"></i> XP del día</span><span><i style="background:#2563eb"></i> Ánimo (1 abrumado – 4 muy bien)</span></div>
          </section>

          <section class="card row">
            <div class="ring" [style.background]="'conic-gradient(var(--g-purple) ' + pctAll() * 3.6 + 'deg, #ece8fb 0)'"><span>{{ pctAll() }}%</span></div>
            <div class="grow"><b>Cumplimiento de retos</b><p class="small muted">{{ game.completedCount() }} de {{ all }} retos completados · {{ all - game.completedCount() }} pendientes</p></div>
          </section>

          <section class="card soft-purple row">
            <app-mascot [mood]="msgMood()" [size]="72" [animated]="true" />
            <div class="grow"><b>{{ msg().t }}</b><p class="small">{{ msg().s }}</p></div>
          </section>
        } @else {
          <section class="card">
            <b>Resumen real</b>
            <div class="tbl">
              @for (r of rows(); track r.k) { <div><span>{{ r.k }}</span><b [style.color]="r.c ?? ''">{{ r.v }}</b></div> }
            </div>
          </section>
          <section class="card">
            <b>Distribución de ánimo</b>
            <div class="col" style="margin-top:10px">
              @for (m of moodDist(); track m.key) {
                <div class="row"><span class="xs bold" style="width:74px">{{ m.label }}</span><div class="bar grow"><i [style.width.%]="m.pct" [style.background]="m.color"></i></div><span class="xs bold" style="width:26px;text-align:right">{{ m.n }}</span></div>
              }
            </div>
          </section>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .kpi { border-radius: 22px; padding: 14px 8px; color: #fff; text-align: center; display: flex; flex-direction: column; box-shadow: var(--g-shadow-sm); } .kpi b { font-size: 30px; line-height: 1.1; } .kpi span { font-size: 12.5px; font-weight: 700; opacity: .92; }
    .seg { display: grid; grid-template-columns: 1fr 1fr; background: #fff; border-radius: 999px; padding: 4px; box-shadow: var(--g-shadow-sm); } .seg button { border: 0; background: none; border-radius: 999px; padding: 10px; font: inherit; font-weight: 800; color: var(--g-muted); cursor: pointer; } .seg button.on { background: var(--g-grad-brand); color: #fff; }
    .mini { display: flex; gap: 4px; } .mini button { border: 0; background: #f1ecff; color: var(--g-purple); border-radius: 999px; font: inherit; font-weight: 800; font-size: 12px; padding: 4px 10px; cursor: pointer; } .mini button.on { background: var(--g-purple); color: #fff; }
    .chart { width: 100%; height: auto; margin-top: 8px; } .ax { font-size: 9.5px; fill: #8b87ad; font-weight: 700; }
    .legend { gap: 14px; font-size: 11.5px; font-weight: 700; color: var(--g-muted); flex-wrap: wrap; } .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 4px; }
    .ring { width: 74px; height: 74px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; position: relative; } .ring::before { content: ''; position: absolute; inset: 9px; background: #fff; border-radius: 50%; } .ring span { position: relative; font-weight: 900; font-size: 17px; }
    .tbl { margin-top: 8px; } .tbl > div { display: flex; justify-content: space-between; padding: 11px 2px; border-bottom: 1px solid #f0edfb; font-size: 14.5px; } .tbl > div:last-child { border: 0; } .tbl span { color: var(--g-muted); font-weight: 700; }
  `],
})
export class ProgressPage {
  game = inject(GameStore);
  private moods = inject(MoodService);
  tab = signal<'week' | 'stats'>('week');
  range = signal<7 | 30>(7);
  all = CHALLENGES.length;

  private series = computed(() => {
    const n = this.range();
    const today = dayStr();
    const days = Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
    const xpBy = new Map<string, number>();
    for (const c of Object.values(this.game.state()?.completed ?? {})) xpBy.set(dayStr(c.at), (xpBy.get(dayStr(c.at)) ?? 0) + c.xp);
    const moodBy = new Map<string, number[]>();
    for (const e of this.moods.entries()) {
      const v = MOODS.find((m) => m.key === e.mood)!.value;
      moodBy.set(e.day, [...(moodBy.get(e.day) ?? []), v]);
    }
    return days.map((d) => ({ day: d, xp: xpBy.get(d) ?? 0, mood: moodBy.has(d) ? moodBy.get(d)!.reduce((a, b) => a + b, 0) / moodBy.get(d)!.length : null }));
  });

  private maxXp = computed(() => Math.max(50, ...this.series().map((s) => s.xp)));
  private niceMax = computed(() => Math.ceil(this.maxXp() / 50) * 50);

  pts = computed<Pt[]>(() => {
    const s = this.series();
    const max = this.niceMax();
    return s.map((p, i) => ({
      day: p.day,
      label: this.range() === 7 ? fmtDate(p.day, { weekday: 'short' }).replace('.', '') : String(+p.day.slice(8)),
      xp: p.xp,
      mood: p.mood,
      x: 40 + (s.length === 1 ? 0 : (i * 266) / (s.length - 1)),
      yXp: 140 - (p.xp / max) * 120,
      yMood: p.mood === null ? null : 140 - ((p.mood - 1) / 3) * 120,
    }));
  });
  labels = computed(() => (this.range() === 7 ? this.pts() : this.pts().filter((_, i) => i % 5 === 0)));
  barW = computed(() => (this.range() === 7 ? 22 : 6));
  grid = computed(() => [0, 0.5, 1].map((f) => ({ y: 140 - f * 120, v: Math.round(this.niceMax() * f) })));
  line = computed(() => this.pts().map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.yXp}`).join(' '));
  area = computed(() => { const p = this.pts(); return p.length ? `${this.line()} L${p[p.length - 1].x},140 L${p[0].x},140 Z` : ''; });
  moodLine = computed(() => this.pts().filter((p) => p.yMood !== null).map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.yMood}`).join(' '));
  total = computed(() => this.series().reduce((a, s) => a + s.xp, 0));
  pctAll = computed(() => Math.round((this.game.completedCount() / this.all) * 100));

  msg = computed(() => {
    const xp = this.game.xp();
    if (xp === 0) return { t: '¡Empecemos!', s: 'Completa tu primer reto para ver tu progreso aquí.' };
    if (this.total() === 0) return { t: 'Retoma el ritmo', s: 'No sumaste XP en este periodo. Un reto corto hoy reactiva tu racha.' };
    return { t: '¡Vas muy bien!', s: `Llevas ${xp.toLocaleString('es-MX')} XP acumulados. Sigue así.` };
  });
  msgMood = computed(() => (this.game.xp() === 0 ? 'normal' : 'happy') as 'normal' | 'happy');

  rows = computed(() => {
    const s = this.game.state();
    const p = s?.personalPlan;
    const plan = !!(p?.goal && p.reason && p.nextStep && p.obstacle && p.strategy);
    return [
      { k: 'XP total acumulado', v: this.game.xp().toLocaleString('es-MX'), c: '#2563eb' },
      { k: 'Nivel actual', v: `${this.game.level().level} — ${this.game.level().name}`, c: '#7c3aed' },
      { k: 'Retos completados', v: `${this.game.completedCount()} / ${this.all}`, c: '#ea580c' },
      { k: 'Sesiones de enfoque', v: String(s?.focusSessions ?? 0), c: '#059669' },
      { k: 'Horas de enfoque', v: ((s?.focusMinutes ?? 0) / 60).toFixed(1) },
      { k: 'Racha actual', v: `${this.game.streak()} días` },
      { k: 'Mejor racha', v: `${longestStreak(s?.activityDays ?? [])} días` },
      { k: 'Registros de ánimo', v: String(this.moods.entries().length) },
      { k: 'Secciones de GRIT leídas', v: `${s?.educationSectionsRead.length ?? 0} / 4` },
      { k: 'Plan personal', v: plan ? 'Completo' : 'Pendiente', c: plan ? '#059669' : '#ea580c' },
    ];
  });

  moodDist = computed(() => {
    const list = this.moods.entries();
    const max = Math.max(1, ...MOODS.map((m) => list.filter((e) => e.mood === m.key).length));
    return MOODS.map((m) => { const n = list.filter((e) => e.mood === m.key).length; return { ...m, n, pct: (n / max) * 100 }; });
  });
}
