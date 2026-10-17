import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { GameStore } from '../../core/game.store';
import { FINAL_EVAL_XP } from '../../core/levels';
import { FinalEvaluation } from '../../core/models';
import { fmtDate } from '../../core/util';
import { HeaderComponent } from '../../shared/header.component';
import { MascotComponent } from '../../shared/mascot.component';

export const INDICATORS = [
  'Organizo adecuadamente mis actividades académicas.',
  'Cumplo mis tareas y responsabilidades a tiempo.',
  'Me siento más motivado(a) para estudiar.',
  'Mantengo hábitos de estudio constantes.',
  'Logro concentrarme durante mis actividades académicas.',
  'Evito distraerme con redes sociales o dispositivos electrónicos.',
  'Identifico fácilmente mis emociones.',
  'Considero que manejo adecuadamente el estrés académico.',
  'Me siento emocionalmente estable durante mis actividades escolares.',
  'Considero útil la metodología propuesta por GritAI.',
];

const SCALE = [
  { v: 1, l: 'Totalmente en desacuerdo' }, { v: 2, l: 'En desacuerdo' }, { v: 3, l: 'Ni de acuerdo ni en desacuerdo' }, { v: 4, l: 'De acuerdo' }, { v: 5, l: 'Totalmente de acuerdo' },
];

type Step = 'locked' | 'intro' | 'participant' | 'questions' | 'review' | 'done';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, DecimalPipe, HeaderComponent, MascotComponent],
  template: `
    <app-header title="Evaluación final" subtitle="Validación metodológica GritAI" />
    <ion-content class="page">
      <div class="wrap">
        @switch (step()) {
          @case ('locked') {
            <section class="card center col fade-up">
              <div class="lk"><ion-icon name="lock-closed" /></div>
              <h2>Evaluación bloqueada</h2>
              <p class="small muted">Completa tu recorrido para desbloquear la evaluación final de GritAI. Debes alcanzar el <b>Nivel 8 — Maestría Grit</b> ({{ need | number }} XP).</p>
              <div class="card soft-green flat"><b class="small">Tu progreso: {{ game.xp() | number }} / {{ need | number }} XP</b>
                <div class="bar green" style="margin:8px 0"><i [style.width.%]="Math.min(100, (game.xp() / need) * 100)"></i></div>
                <p class="xs">Faltan {{ Math.max(0, need - game.xp()) | number }} XP · Nivel actual: {{ game.level().name }}</p></div>
              <app-mascot mood="normal" [size]="90" />
            </section>
          }
          @case ('intro') {
            <section class="card grad grad-fresh">
              <app-mascot mood="happy" [size]="90" [animated]="true" />
              <h2>¡Has llegado al nivel final!</h2>
              <p class="small op">Esta evaluación busca conocer tu experiencia con GritAI y tu percepción sobre aspectos de organización, hábitos, enfoque y bienestar durante las actividades académicas.</p>
            </section>
            <section class="card col"><p class="small">Son <b>10 afirmaciones</b> con escala del 1 al 5 y unos pocos datos de participante. Toma unos 3 minutos. Tus respuestas se guardan en este dispositivo y puedes exportarlas al terminar.</p>
              <button class="btn xl block" (click)="go('participant')">Comenzar</button></section>
          }
          @case ('participant') {
            <section class="card col">
              <h3>Datos del participante</h3>
              @for (f of fields; track f.k) { <div class="field"><label [for]="f.k">{{ f.l }}</label><input [id]="f.k" class="input" [type]="f.t ?? 'text'" [attr.inputmode]="f.m ?? null" [(ngModel)]="ev[f.k]" (ngModelChange)="persist()" [placeholder]="f.p" /></div> }
              <button class="btn xl block" [disabled]="!participantOk()" (click)="go('questions')">Continuar</button>
            </section>
          }
          @case ('questions') {
            <section class="card col">
              <div class="row between"><span class="chip">Pregunta {{ q() + 1 }} de 10</span><span class="xs muted bold">{{ answered() }} respondidas</span></div>
              <div class="bar"><i [style.width.%]="((q() + 1) / 10) * 100"></i></div>
              <h3 class="qt">{{ indicators[q()] }}</h3>
              <div class="col" role="radiogroup" [attr.aria-label]="indicators[q()]">
                @for (s of scale; track s.v) {
                  <button class="opt" role="radio" [attr.aria-checked]="ev.answers[q()] === s.v" [class.on]="ev.answers[q()] === s.v" (click)="answer(s.v)"><b>{{ s.v }}</b><span>{{ s.l }}</span></button>
                }
              </div>
              <div class="row">
                <button class="btn ghost" [disabled]="q() === 0" (click)="q.set(q() - 1)">Anterior</button>
                @if (q() < 9) { <button class="btn grow" [disabled]="!ev.answers[q()]" (click)="q.set(q() + 1)">Siguiente</button> } @else { <button class="btn green grow" [disabled]="answered() < 10" (click)="go('review')">Revisar</button> }
              </div>
            </section>
          }
          @case ('review') {
            <section class="card col">
              <h3>Revisa tus respuestas</h3>
              @for (t of indicators; track $index; let i = $index) { <div class="rv"><span class="small">{{ i + 1 }}. {{ t }}</span><b class="chip">{{ ev.answers[i] }}</b></div> }
            </section>
            <section class="card col">
              <label class="chk"><input type="checkbox" [(ngModel)]="ev.consent" (ngModelChange)="persist()" /> Declaro que participé voluntariamente en la validación metodológica del proyecto GritAI, desarrollando las actividades propuestas durante el periodo de evaluación y respondiendo este instrumento de manera honesta.</label>
              <p class="xs muted">Firma del participante: <b>{{ ev.participantName }}</b></p>
              <button class="btn green xl block" [disabled]="!ev.consent" (click)="submit()">Enviar evaluación</button>
              <button class="btn ghost" (click)="go('questions')">Editar respuestas</button>
            </section>
          }
          @case ('done') {
            <section class="card soft-green center col pop">
              <app-mascot mood="happy" [size]="110" [animated]="true" />
              <h2>¡Gracias por participar!</h2>
              <p class="small">Evaluación registrada el {{ date() }}. Promedio de tus respuestas: <b>{{ avg() }}</b> / 5.</p>
            </section>
            <section class="card col">
              <b>Entrega de resultados</b>
              <p class="small muted">Como GritAI funciona sin conexión, descarga tu evaluación y compártela con el equipo del proyecto.</p>
              <button class="btn" (click)="download('csv')"><ion-icon name="download" /> Descargar CSV</button>
              <button class="btn ghost" (click)="download('json')"><ion-icon name="download" /> Descargar JSON</button>
            </section>
          }
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .lk { width: 76px; height: 76px; border-radius: 50%; background: #f1f1f8; display: grid; place-items: center; font-size: 38px; color: #9a96bd; margin: 0 auto; } h2 { font-size: 22px; } .op { opacity: .92; margin-top: 6px; }
    .qt { font-size: 19px; line-height: 1.3; margin: 6px 0; } .opt { display: flex; align-items: center; gap: 12px; border: 2px solid #e6e0fb; background: #fff; border-radius: 16px; padding: 12px 14px; font: inherit; text-align: left; cursor: pointer; color: var(--g-ink); b { width: 30px; height: 30px; border-radius: 50%; background: #f1ecff; color: var(--g-purple); display: grid; place-items: center; flex-shrink: 0; } span { font-weight: 700; } }
    .opt.on { border-color: var(--g-purple); background: #f6f0ff; b { background: var(--g-purple); color: #fff; } }
    .rv { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f0edfb; } .chk { display: flex; gap: 10px; align-items: flex-start; font-weight: 700; font-size: 13.5px; line-height: 1.4; } .chk input { width: 22px; height: 22px; accent-color: var(--g-green); flex-shrink: 0; margin-top: 2px; }
  `],
})
export class EvaluationPage {
  game = inject(GameStore);
  Math = Math;
  need = FINAL_EVAL_XP;
  indicators = INDICATORS;
  scale = SCALE;
  q = signal(0);
  step = signal<Step>('locked');
  ev: FinalEvaluation = { ...({} as FinalEvaluation), ...structuredClone(this.game.state()!.evaluation) };

  fields: { k: keyof FinalEvaluation; l: string; p: string; t?: string; m?: string }[] = [
    { k: 'participantName', l: 'Nombre completo', p: 'Tu nombre completo' },
    { k: 'age', l: 'Edad', p: 'Años', t: 'number', m: 'numeric' },
    { k: 'institution', l: 'Institución', p: 'Ej. Universidad Autónoma de Coahuila' },
    { k: 'program', l: 'Carrera / programa académico', p: 'Ej. Ing. en Sistemas' },
    { k: 'enrollment', l: 'Matrícula', p: 'Tu matrícula' },
    { k: 'semester', l: 'Semestre', p: 'Ej. 6.º' },
    { k: 'startDate', l: 'Fecha de inicio', p: '', t: 'date' },
  ];

  answered = computed(() => { this.tick(); return this.ev.answers.filter((a) => a > 0).length; });
  private tick = signal(0);
  date = computed(() => (this.ev.submittedAt ? fmtDate(this.ev.submittedAt) : ''));
  avg = computed(() => { this.tick(); const a = this.ev.answers; return (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1); });

  constructor() {
    this.step.set(this.ev.submitted ? 'done' : this.game.isMaster() ? 'intro' : 'locked');
  }

  participantOk(): boolean {
    const e = this.ev;
    return !!(e.participantName.trim().split(/\s+/).length >= 2 && Number(e.age) > 0 && e.institution.trim() && e.program.trim() && e.enrollment.trim() && e.semester.trim() && e.startDate);
  }

  go(s: Step): void { this.persist(); this.step.set(s); }
  answer(v: number): void { this.ev.answers[this.q()] = v; this.tick.update((n) => n + 1); this.persist(); }
  persist(): void { this.game.patch({ evaluation: structuredClone(this.ev) }); }
  submit(): void {
    this.ev.submitted = true;
    this.ev.submittedAt = Date.now();
    this.tick.update((n) => n + 1);
    this.persist();
    this.step.set('done');
  }

  download(kind: 'csv' | 'json'): void {
    const e = this.ev;
    let body: string;
    if (kind === 'json') body = JSON.stringify({ proyecto: 'GritAI', formato: 'Seguimiento y validación metodológica', ...e, indicadores: INDICATORS.map((t, i) => ({ indicador: t, respuesta: e.answers[i] })) }, null, 2);
    else {
      const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
      body = '﻿' + [
        ['Nombre completo', 'Edad', 'Institución', 'Carrera/Programa', 'Matrícula', 'Semestre', 'Fecha de inicio', ...INDICATORS.map((_, i) => `P${i + 1}`), 'Promedio', 'Consentimiento', 'Fecha de envío'].map(q).join(','),
        [e.participantName, e.age, e.institution, e.program, e.enrollment, e.semester, e.startDate, ...e.answers, this.avg(), e.consent ? 'Sí' : 'No', new Date(e.submittedAt ?? Date.now()).toISOString()].map(q).join(','),
        '', INDICATORS.map((t, i) => q(`P${i + 1}: ${t}`)).join('\n'),
      ].join('\n');
    }
    const url = URL.createObjectURL(new Blob([body], { type: kind === 'json' ? 'application/json' : 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `gritai-evaluacion.${kind}`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}
