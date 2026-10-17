import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { GameStore } from '../../core/game.store';
import { PersonalPlan } from '../../core/models';
import { PwaService } from '../../core/pwa.service';
import { HeaderComponent } from '../../shared/header.component';
import { MascotComponent } from '../../shared/mascot.component';

type Tab = 'intro' | 'componentes' | 'actividades' | 'videos';

const COMPONENTS = [
  { id: 'interes', icon: 'search', title: 'Interés', short: 'Explorar lo que despierta tu curiosidad.', detail: 'El interés es la chispa que enciende el GRIT. Tener curiosidad genuina por una actividad o meta facilita la perseverancia a largo plazo. No siempre se sabe desde el principio qué nos apasiona; a veces hay que explorar diferentes áreas.', example: 'Prueba distintas materias, actividades o proyectos hasta encontrar algo que te enganche y que quieras seguir desarrollando.', action: 'Esta semana, dedica 15 minutos a explorar algo nuevo: un tema, una habilidad o una lectura que te llame la atención.', color: 'linear-gradient(135deg,#38bdf8,#06b6d4)' },
  { id: 'practica', icon: 'repeat', title: 'Práctica', short: 'Practicar deliberadamente e identificar áreas de mejora.', detail: 'La práctica deliberada consiste en trabajar de forma específica en los aspectos donde más necesitas mejorar, no solo repetir lo que ya sabes. Implica recibir retroalimentación, identificar errores y ajustar la estrategia.', example: 'Si quieres mejorar en matemáticas, no repases solo los ejercicios fáciles; dedica más tiempo a los tipos de problemas que te cuestan más trabajo.', action: 'Identifica una habilidad o área que quieras mejorar y diseña una pequeña rutina de práctica enfocada de 10 a 20 minutos.', color: 'linear-gradient(135deg,#fb923c,#ef4444)' },
  { id: 'proposito', icon: 'locate', title: 'Propósito', short: 'Conectar tu meta con una razón significativa.', detail: 'El propósito es la razón por la que algo importa más allá de uno mismo. Cuando una meta tiene significado personal o impacto en los demás, la motivación para persistir tiende a ser más profunda y duradera.', example: 'Si estudias medicina, conectar el esfuerzo diario con el deseo de ayudar a pacientes puede darte energía en los momentos difíciles.', action: 'Escribe en una frase por qué tu meta principal es importante para ti y qué impacto tendría alcanzarla.', color: 'linear-gradient(135deg,#a78bfa,#7c3aed)' },
  { id: 'esperanza', icon: 'leaf', title: 'Esperanza', short: 'Mantener la posibilidad de mejorar ante las dificultades.', detail: 'La esperanza, en el contexto del GRIT, es la creencia de que puedes mejorar buscando estrategias alternativas y apoyándote en otros cuando lo necesitas. No significa ignorar los obstáculos, sino no rendirse ante ellos.', example: "Cuando una estrategia de estudio no funciona, en lugar de concluir que 'no sirves para eso', puedes preguntarte: ¿qué otro enfoque podría probar?", action: 'La próxima vez que enfrentes un obstáculo, escribe al menos dos estrategias diferentes que podrías intentar antes de rendirte.', color: 'linear-gradient(135deg,#4ade80,#10b981)' },
];

const VIDEOS = [
  { id: 'v1', title: 'GRIT: The Power of Passion and Perseverance', speaker: 'Angela Duckworth · TED', description: 'Introducción al concepto de GRIT y la relación entre pasión y perseverancia hacia metas a largo plazo.', url: 'https://www.youtube.com/watch?v=H14bBuluwB8', platform: 'YouTube', recommended: true },
  { id: 'v2', title: 'How to Turn Grit Into a Lifelong Habit', speaker: 'Angela Duckworth y Chris Anderson · TED Interview', description: 'Conversación sobre la perseverancia y cómo mantenerla en objetivos de largo plazo.', url: 'https://www.ted.com/talks/the_ted_interview_how_to_turn_grit_into_a_lifelong_habit_angela_duckworth', platform: 'TED', recommended: false },
  { id: 'v3', title: 'Grit and Perseverance in Developmental Psychology', speaker: 'Angela Duckworth · UChicago', description: 'Recurso académico para profundizar en el enfoque de investigación sobre GRIT y la perseverancia.', url: 'https://hceconomics.uchicago.edu/video/angela-duckworth-grit-and-perseverance-developmental-psychology', platform: 'Universidad de Chicago', recommended: false },
  { id: 'v4', title: 'GRIT: The Power of Passion and Perseverance', speaker: 'Angela Duckworth · Global Leadership Summit', description: 'Conferencia sobre pasión, perseverancia y objetivos a largo plazo en un contexto de liderazgo.', url: 'https://globalleadership.org/videos/leading-yourself/grit-the-power-of-passion-and-perseverance', platform: 'Global Leadership Summit', recommended: false },
];

const AREAS = [
  { id: 'escuela', icon: 'school', title: 'Escuela', content: 'Divide un proyecto en tareas pequeñas y revisa el avance cada día. Si una estrategia de estudio no funciona, experimenta con otra: mapas mentales, explicar el tema en voz alta, o practicar con ejercicios de exámenes anteriores.' },
  { id: 'deporte', icon: 'football', title: 'Deporte', content: 'Practica una técnica, recibe retroalimentación de tu entrenador y ajusta el entrenamiento según tus áreas de mejora. La constancia importa más que la intensidad aislada.' },
  { id: 'habilidades', icon: 'musical-notes', title: 'Habilidades', content: 'Dedica tiempo constante a aprender algo nuevo. Divide la habilidad en componentes más pequeños y trabaja en cada uno. Celebra los progresos pequeños.' },
  { id: 'metas', icon: 'star', title: 'Metas personales', content: 'Identifica obstáculos posibles y elabora un plan realista. ¿A quién puedes pedir apoyo? ¿Qué harías diferente si la primera estrategia no funciona?' },
];

const QUESTIONS = [
  'Cuando una actividad se vuelve difícil, ¿qué sueles hacer?',
  '¿Qué haces cuando una estrategia no funciona?',
  '¿Cómo reaccionas cuando cometes un error?',
  '¿Qué te ayuda a continuar trabajando hacia una meta?',
  '¿Cuándo consideras importante pedir ayuda o descansar?',
];

const PLAN_FIELDS: { key: keyof PersonalPlan; label: string; ph: string }[] = [
  { key: 'goal', label: 'Mi objetivo', ph: 'Ej: Mejorar mi organización académica' },
  { key: 'reason', label: '¿Por qué es importante para mí?', ph: 'Ej: Entregar mis actividades a tiempo' },
  { key: 'nextStep', label: '¿Cuál será mi siguiente paso?', ph: 'Ej: Planear las tareas de mañana' },
  { key: 'obstacle', label: '¿Qué obstáculo podría encontrar?', ph: 'Ej: Distraerme con el teléfono' },
  { key: 'strategy', label: '¿Qué estrategia utilizaré?', ph: 'Ej: Usar el modo enfoque 25 min' },
  { key: 'support', label: '¿A quién puedo pedir ayuda?', ph: 'Ej: Un compañero, un docente…' },
  { key: 'reviewDate', label: '¿Cuándo revisaré mi avance?', ph: 'Ej: Al final de la semana' },
];

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, HeaderComponent, MascotComponent],
  template: `
    <app-header title="Descubre el GRIT" [subtitle]="(game.state()?.educationSectionsRead?.length ?? 0) + ' sección(es) exploradas'">
      <app-mascot mood="happy" [size]="48" [animated]="true" />
    </app-header>
    <ion-content class="page">
      <div class="wrap">
        <div class="tabs" role="tablist">
          @for (t of tabs; track t.id) { <button role="tab" [attr.aria-selected]="tab() === t.id" [class.on]="tab() === t.id" (click)="select(t.id)"><ion-icon [name]="t.icon" /> {{ t.label }}</button> }
        </div>

        @switch (tab()) {
          @case ('intro') {
            <section class="card grad grad-brand">
              <app-mascot mood="happy" [size]="84" />
              <h2>Bienvenido a Descubre el GRIT</h2>
              <p class="small op">Aprende qué es la perseverancia, cómo se relaciona con tus metas y qué estrategias puedes desarrollar para avanzar a tu propio ritmo.</p>
              <div class="row wrapflex" style="gap:6px;margin-top:10px">@for (c of ['¿Qué es el GRIT?', 'Investigación', 'Vida real', '4 componentes']; track c) { <span class="chip white">{{ c }}</span> }</div>
            </section>
            <section class="card col">
              <div class="row"><div class="ic"><ion-icon name="book" /></div><h3>¿Quién es Angela Duckworth?</h3></div>
              <p class="small">Angela Duckworth es una psicóloga e investigadora conocida por sus estudios sobre el GRIT, concepto relacionado con la <b>pasión y la perseverancia hacia objetivos de largo plazo</b>. Su investigación ha explorado por qué algunas personas perseveran ante los obstáculos mientras otras abandonan.</p>
              <a class="lnk" href="https://www.angeladuckworth.com/grit/" target="_blank" rel="noopener noreferrer">Sitio oficial de Angela Duckworth <ion-icon name="open-outline" /></a>
            </section>
            <section class="card col">
              <h3>¿Qué es el GRIT?</h3>
              <p class="small">GRIT se refiere a la combinación de <b>pasión y perseverancia</b> hacia objetivos de largo plazo. No se trata de esforzarse siempre de la misma manera, sino de mantener una dirección, aprender de los errores y ajustar las estrategias cuando algo no funciona.</p>
              <div class="grid2"><div class="card soft-blue flat"><b class="small" style="color:#1d4ed8">Pasión</b><p class="xs">Mantener interés y dirección hacia una meta significativa.</p></div><div class="card soft-purple flat"><b class="small" style="color:#6d28d9">Perseverancia</b><p class="xs">Continuar esforzándose y ajustando estrategias ante las dificultades.</p></div></div>
              <div class="card soft-orange flat"><b class="small">Ejemplo práctico</b><p class="small">Si quieres mejorar en una materia, puedes practicar con constancia, aprender de tus errores y buscar otra estrategia cuando algo no funciona.</p></div>
              <p class="xs muted"><b>Nota:</b> La perseverancia no significa insistir siempre de la misma manera, ignorar el bienestar o negarse a pedir ayuda. Descansar y modificar un plan también puede ser adecuado.</p>
            </section>
            <section class="card col">
              <h3>¿Qué dice la investigación?</h3>
              <p class="small">Las investigaciones sobre GRIT estudian cómo la pasión y la perseverancia se relacionan con el avance hacia metas de largo plazo. Sin embargo, el desempeño también depende de factores como las oportunidades, los recursos, el entorno, las estrategias y el apoyo.</p>
              <div class="card soft-green flat"><p class="xs"><b>Interpretación responsable:</b> Los resultados de investigación deben interpretarse según el contexto y el método utilizado. El GRIT es uno de los factores asociados al logro, no el único ni el determinante.</p></div>
            </section>
            <section class="card col">
              <h3>El GRIT en la vida real</h3>
              <div class="grid2">@for (a of areas; track a.id) { <button class="area" [class.on]="area() === a.id" (click)="area.set(area() === a.id ? '' : a.id)"><ion-icon [name]="a.icon" /><b>{{ a.title }}</b></button> }</div>
              @for (a of areas; track a.id) { @if (area() === a.id) { <div class="card soft-orange flat pop"><p class="small">{{ a.content }}</p></div> } }
            </section>
          }
          @case ('componentes') {
            <p class="small muted">Angela Duckworth describe cuatro componentes asociados al GRIT. Se presentan como un marco educativo, no como una receta infalible.</p>
            @for (c of comps; track c.id) {
              <section class="card comp">
                <button class="ch" (click)="open.set(open() === c.id ? '' : c.id)">
                  <div class="ic big" [style.background]="c.color"><ion-icon [name]="c.icon" /></div>
                  <div class="grow"><h3>{{ c.title }}</h3><p class="xs muted">{{ c.short }}</p></div><ion-icon [name]="open() === c.id ? 'chevron-up' : 'chevron-down'" />
                </button>
                @if (open() === c.id) {
                  <div class="col pop" style="margin-top:12px">
                    <p class="small">{{ c.detail }}</p>
                    <div class="card soft-blue flat"><b class="xs">Ejemplo</b><p class="small">{{ c.example }}</p></div>
                    <div class="card soft-green flat"><b class="xs">Acción para esta semana</b><p class="small">{{ c.action }}</p></div>
                  </div>
                }
              </section>
            }
            <p class="xs muted">El aprendizaje, el entorno, las oportunidades, las estrategias, el descanso y el apoyo también influyen en el progreso personal.</p>
          }
          @case ('actividades') {
            <div class="seg3"><button [class.on]="view() === 'quiz'" (click)="view.set('quiz')">Reflexión</button><button [class.on]="view() === 'plan'" (click)="view.set('plan')">Mi plan</button><button [class.on]="view() === 'summary'" (click)="view.set('summary')">Resumen</button></div>
            @if (view() === 'quiz') {
              <section class="card col">
                <h3>Reflexiona sobre tu perseverancia</h3>
                <p class="xs muted">Responde pensando en tus experiencias. No existen respuestas perfectas. Esta actividad busca ayudarte a conocerte mejor.</p>
                @if (!quizDone()) {
                  <div class="bar"><i [style.width.%]="((step() + 1) / questions.length) * 100"></i></div>
                  <div class="field"><label for="q">{{ step() + 1 }}. {{ questions[step()] }}</label>
                    <textarea id="q" class="textarea" rows="4" placeholder="Escribe tu reflexión aquí…" [ngModel]="answers()[step()]" (ngModelChange)="setAnswer($event)"></textarea></div>
                  <div class="row">
                    @if (step() > 0) { <button class="btn ghost" (click)="step.set(step() - 1)">Anterior</button> }
                    @if (step() < questions.length - 1) { <button class="btn grow" (click)="step.set(step() + 1)">Siguiente</button> } @else { <button class="btn green grow" (click)="saveQuiz()">Guardar reflexiones</button> }
                  </div>
                } @else {
                  @for (q of questions; track $index; let i = $index) { <div class="card soft-purple flat"><b class="xs">{{ q }}</b><p class="small">{{ answers()[i] || '—' }}</p></div> }
                  <button class="btn ghost" (click)="quizDone.set(false); step.set(0)">Editar respuestas</button>
                }
              </section>
              <p class="xs muted">Esta actividad no es una prueba psicológica validada ni una escala oficial de GRIT. No genera diagnósticos; su objetivo es la reflexión personal.</p>
            }
            @if (view() === 'plan') {
              <section class="card col">
                <h3>Mi plan personal de GRIT</h3>
                @for (f of planFields; track f.key) { <div class="field"><label [for]="f.key">{{ f.label }}</label><input [id]="f.key" class="input" [(ngModel)]="plan[f.key]" [placeholder]="f.ph" /></div> }
                <button class="btn green xl block" (click)="savePlan()">{{ planSaved() ? 'Plan guardado' : 'Guardar mi plan' }}</button>
              </section>
            }
            @if (view() === 'summary') {
              <section class="card grad grad-brand"><h2>Resumen de aprendizaje</h2><p class="small op">Tu avance en Descubre el GRIT: {{ game.state()?.educationSectionsRead?.length ?? 0 }} de 4 secciones exploradas.</p></section>
              @if (game.state()?.personalPlan?.goal) {
                <section class="card col"><h3>Tu plan personal</h3>
                  @for (f of planFields; track f.key) { @if (game.state()!.personalPlan[f.key]) { <p class="small"><b>{{ f.label }}</b><br />{{ game.state()!.personalPlan[f.key] }}</p> } }</section>
              }
              <section class="card col"><h3>Tu reflexión final</h3>
                <textarea class="textarea" rows="4" [(ngModel)]="note" placeholder="¿Qué idea te resultó más útil? ¿Qué acción concreta pondrás en práctica?"></textarea>
                <button class="btn ghost" (click)="saveNote()">{{ noteSaved() ? 'Guardado' : 'Guardar reflexión' }}</button></section>
            }
          }
          @case ('videos') {
            <p class="small muted"><ion-icon name="cloud-offline-outline" /> Los videos se abren en tu navegador y requieren conexión a internet.</p>
            @for (v of videos; track v.id) {
              <section class="card col">
                <div class="row"><div class="ic big" style="background:var(--g-grad-sunset)"><ion-icon name="play" /></div>
                  <div class="grow"><h3 class="vt">{{ v.title }}</h3><p class="xs muted">{{ v.speaker }}</p></div></div>
                <p class="small">{{ v.description }}</p>
                <div class="row wrapflex">
                  @if (v.recommended) { <span class="chip orange">Recomendado</span> } <span class="chip gray">{{ v.platform }}</span>
                  <span class="grow"></span>
                  <button class="icon-btn" (click)="toggleVideo(v.id)" [attr.aria-label]="isSaved(v.id) ? 'Quitar de guardados' : 'Guardar video'"><ion-icon [name]="isSaved(v.id) ? 'bookmark' : 'bookmark-outline'" /></button>
                  <a class="btn sm" [href]="v.url" target="_blank" rel="noopener noreferrer">Ver <ion-icon name="open-outline" /></a>
                </div>
              </section>
            }
          }
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; } .tabs::-webkit-scrollbar { display: none; }
    .tabs button { flex-shrink: 0; display: flex; align-items: center; gap: 6px; border: 2px solid #e3d6ff; background: #fff; color: var(--g-muted); font: inherit; font-weight: 800; font-size: 13.5px; padding: 8px 14px; border-radius: 999px; cursor: pointer; } .tabs button.on { background: var(--g-grad-brand); border-color: transparent; color: #fff; box-shadow: 0 6px 14px rgba(91,52,214,.28); }
    h2 { font-size: 21px; margin: 6px 0; } h3 { font-size: 17px; } .op { opacity: .9; } .ic { width: 40px; height: 40px; border-radius: 14px; background: #f1ecff; color: var(--g-purple); display: grid; place-items: center; font-size: 21px; flex-shrink: 0; } .ic.big { width: 48px; height: 48px; color: #fff; font-size: 24px; border-radius: 16px; }
    .lnk { color: var(--g-purple); font-weight: 800; font-size: 14px; text-decoration: none; display: inline-flex; gap: 6px; align-items: center; }
    .area { border: 2px solid #e6e0fb; background: #fff; border-radius: 18px; padding: 14px 10px; font: inherit; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; color: var(--g-ink); ion-icon { font-size: 26px; color: var(--g-orange); } } .area.on { border-color: var(--g-orange); background: #fff7ed; }
    .comp .ch { display: flex; align-items: center; gap: 12px; width: 100%; border: 0; background: none; font: inherit; text-align: left; cursor: pointer; padding: 0; color: var(--g-ink); }
    .seg3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #fff; padding: 4px; border-radius: 999px; box-shadow: var(--g-shadow-sm); } .seg3 button { border: 0; background: none; border-radius: 999px; padding: 9px 4px; font: inherit; font-weight: 800; font-size: 13.5px; color: var(--g-muted); cursor: pointer; } .seg3 button.on { background: var(--g-grad-brand); color: #fff; }
    .vt { font-size: 15px; line-height: 1.25; } a.btn { text-decoration: none; }
  `],
})
export class DiscoverPage {
  game = inject(GameStore);
  pwa = inject(PwaService);
  tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'intro', label: '¿Qué es el GRIT?', icon: 'bulb' },
    { id: 'componentes', label: 'Componentes', icon: 'locate' },
    { id: 'actividades', label: 'Actividades', icon: 'create' },
    { id: 'videos', label: 'Videos', icon: 'play-circle' },
  ];
  comps = COMPONENTS; videos = VIDEOS; areas = AREAS; questions = QUESTIONS; planFields = PLAN_FIELDS;
  tab = signal<Tab>('intro');
  area = signal('');
  open = signal('');
  view = signal<'quiz' | 'plan' | 'summary'>('quiz');
  step = signal(0);
  answers = signal<string[]>([...(this.game.state()?.reflexionAnswers ?? Array(5).fill(''))]);
  quizDone = signal((this.game.state()?.reflexionAnswers ?? []).some((a) => a.length > 0));
  plan: PersonalPlan = { ...(this.game.state()?.personalPlan ?? ({} as PersonalPlan)) };
  planSaved = signal(false);
  note = this.game.state()?.learningNote ?? '';
  noteSaved = signal(false);
  private saved = computed(() => this.game.state()?.savedVideos ?? []);

  constructor() { this.mark('intro'); }

  private mark(id: string): void {
    const s = this.game.state();
    if (s && !s.educationSectionsRead.includes(id)) this.game.update((st) => { st.educationSectionsRead = [...st.educationSectionsRead, id]; });
  }
  select(t: Tab): void { this.tab.set(t); this.mark(t); }
  setAnswer(v: string): void { this.answers.update((a) => a.map((x, i) => (i === this.step() ? v : x))); }
  saveQuiz(): void { this.game.patch({ reflexionAnswers: this.answers() }); this.quizDone.set(true); }
  savePlan(): void { this.game.patch({ personalPlan: { ...this.plan } }); this.planSaved.set(true); setTimeout(() => this.planSaved.set(false), 2000); }
  saveNote(): void { this.game.patch({ learningNote: this.note }); this.noteSaved.set(true); setTimeout(() => this.noteSaved.set(false), 2000); }
  isSaved(id: string): boolean { return this.saved().includes(id); }
  toggleVideo(id: string): void { this.game.update((s) => { s.savedVideos = s.savedVideos.includes(id) ? s.savedVideos.filter((x) => x !== id) : [...s.savedVideos, id]; }); }
}
