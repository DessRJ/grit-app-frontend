import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { IonContent, IonIcon, NavController } from '@ionic/angular';
import { QUOTES } from '../../core/content';
import { GameStore } from '../../core/game.store';
import { MoodService } from '../../core/mood.service';
import { MascotComponent } from '../../shared/mascot.component';
import { MoodKey } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, IonIcon, MascotComponent, DecimalPipe],
  template: `
    <ion-content class="page" [fullscreen]="true">
      <div class="wrap wrap-tabs">
        <header class="hd fade-up">
          <div class="grow">
            <h1>Hola, {{ game.name() }}</h1>
            <p class="muted bold">{{ game.level().name }} · Nivel {{ game.level().level }}</p>
          </div>
          <button class="mbtn" (click)="go('/tabs/profile')" aria-label="Ir a mi perfil"><app-mascot [mood]="mood()" [size]="78" [animated]="true" /></button>
        </header>

        <div class="grid2 fade-up">
          <div class="stat"><ion-icon name="flash" class="i blue" /><span class="l">XP total</span><b>{{ game.xp() | number }}</b></div>
          <div class="stat"><ion-icon name="trophy" class="i purple" /><span class="l">Nivel</span><b>{{ game.level().level }}</b><small>{{ game.level().name }}</small></div>
          <div class="stat"><ion-icon name="flame" class="i orange" /><span class="l">Racha</span><b>{{ game.streak() }} <small>días</small></b></div>
          <div class="stat"><ion-icon name="checkmark-done" class="i green" /><span class="l">Retos</span><b>{{ game.completedCount() }}</b></div>
        </div>

        <section class="card fade-up">
          @if (game.nextLevel(); as n) {
            <div class="row between"><b>Progreso al Nivel {{ n.level }}</b><span class="xs muted bold">{{ game.xpIntoLevel() | number }}/{{ game.xpNeeded() | number }} XP</span></div>
            <div class="bar" style="margin:10px 0 8px"><i [style.width.%]="game.levelPct()"></i></div>
            <p class="xs muted">Te faltan {{ game.xpMissing() | number }} XP para «{{ n.name }}»</p>
          } @else {
            <div class="row between"><b>¡Nivel máximo alcanzado!</b><span class="chip orange">Maestría Grit</span></div>
            <div class="bar orange" style="margin:10px 0 8px"><i style="width:100%"></i></div>
            <p class="xs muted">Completa los retos finales y la Evaluación Final de GritAI.</p>
          }
        </section>

        @if (game.featured(); as f) {
          <section class="card grad grad-brand fade-up">
            <div class="row">
              <div class="ico"><ion-icon [name]="f.icon" /></div>
              <div class="grow"><small class="op">RETO DEL DÍA</small><h3>{{ f.name }}</h3></div>
              <span class="chip white"><ion-icon name="flash" />{{ f.xp }} XP</span>
            </div>
            <p class="small op" style="margin:10px 0 14px">{{ f.mech }}</p>
            <div class="row">
              <button class="btn light grow" (click)="go('/challenge/' + f.id)">Empezar reto</button>
              <button class="btn ghost-w" (click)="go('/tabs/challenges')">Ver todos</button>
            </div>
          </section>
        } @else {
          <section class="card grad grad-sunset fade-up">
            <h3>¡Completaste todos los retos del nivel!</h3>
            <p class="small op" style="margin-top:6px">Sigue entrenando tu enfoque o repasa tus logros.</p>
          </section>
        }

        @if (!todayMood()) {
          <button class="card tap moodq fade-up" (click)="go('/mood')">
            <app-mascot mood="normal" [size]="54" />
            <span class="grow"><b>¿Cómo te sientes hoy?</b><br /><span class="xs muted">Registra tu estado de ánimo (1 min)</span></span>
            <ion-icon name="chevron-forward" />
          </button>
        }

        <h2 class="sec">Tu espacio</h2>
        <div class="grid2 tiles fade-up">
          @for (t of tiles; track t.label) {
            <button class="tile" [style.background]="t.bg" (click)="go(t.url)" [disabled]="t.locked && !game.isMaster()" [class.off]="t.locked && !game.isMaster()">
              <ion-icon [name]="t.locked && !game.isMaster() ? 'lock-closed' : t.icon" />
              <b>{{ t.label }}</b>
              <small>{{ t.locked && !game.isMaster() ? 'Alcanza el Nivel 8' : t.sub }}</small>
            </button>
          }
        </div>

        <section class="card soft-purple quote fade-up">
          <small class="muted bold">FRASE DEL DÍA</small>
          <p>“{{ quote.text }}”</p>
          @if (quote.author) { <span class="xs muted">— {{ quote.author }}</span> }
        </section>
      </div>
    </ion-content>
  `,
  styles: [`
    .hd { display: flex; align-items: center; gap: 10px; padding-top: 18px; } h1 { font-size: 30px; }
    .mbtn { background: none; border: 0; padding: 0; cursor: pointer; }
    .stat { background: #fff; border-radius: 22px; padding: 14px 16px; box-shadow: var(--g-shadow-sm); border: 1.5px solid rgba(124,58,237,.08); display: flex; flex-direction: column; gap: 2px; position: relative; }
    .stat .l { font-size: 12.5px; font-weight: 800; color: var(--g-muted); } .stat b { font-size: 28px; line-height: 1.1; } .stat small { font-size: 12px; font-weight: 700; color: var(--g-muted); }
    .stat .i { position: absolute; right: 14px; top: 14px; font-size: 22px; } .i.blue { color: var(--g-blue); } .i.purple { color: var(--g-purple); } .i.orange { color: var(--g-orange); } .i.green { color: var(--g-green); }
    .ico { width: 46px; height: 46px; border-radius: 16px; background: rgba(255,255,255,.2); display: grid; place-items: center; font-size: 26px; }
    .op { opacity: .88; } small.op { font-weight: 800; letter-spacing: 1.2px; font-size: 11px; }
    .btn.ghost-w { background: rgba(255,255,255,.18); box-shadow: none; padding-inline: 18px; }
    .moodq { display: flex; align-items: center; gap: 12px; text-align: left; font: inherit; color: var(--g-ink); width: 100%; }
    h2.sec { font-size: 18px; margin-top: 6px; }
    .tile { border: 0; border-radius: 24px; padding: 16px; color: #fff; text-align: left; font: inherit; display: flex; flex-direction: column; gap: 3px; min-height: 108px; justify-content: flex-end; cursor: pointer; box-shadow: var(--g-shadow-sm); &:active { transform: scale(.97); } }
    .tile ion-icon { font-size: 28px; margin-bottom: 6px; } .tile b { font-size: 16px; } .tile small { opacity: .88; font-weight: 700; font-size: 12px; }
    .tile.off { filter: grayscale(.85); opacity: .7; }
    .quote p { font-size: 17px; font-weight: 800; line-height: 1.35; margin: 6px 0 4px; color: #4c1d95; }
  `],
})
export class HomePage {
  game = inject(GameStore);
  private moods = inject(MoodService);
  private nav = inject(NavController);
  quote = QUOTES[new Date().getDate() % QUOTES.length];

  todayMood = computed(() => {
    const d = this.game.today();
    return this.moods.entries().find((e) => e.day === d) ?? null;
  });
  mood = computed<MoodKey>(() => this.moods.latest()?.mood ?? 'happy');

  tiles = [
    { label: 'Estado de ánimo', sub: 'Tu diario emocional', icon: 'heart', url: '/mood', bg: 'linear-gradient(135deg,#f472b6,#e11d48)' },
    { label: 'Mi progreso', sub: 'Gráficas y estadísticas', icon: 'stats-chart', url: '/progress', bg: 'linear-gradient(135deg,#10b981,#0ea5e9)' },
    { label: 'Descubre el GRIT', sub: 'Aprende y reflexiona', icon: 'bulb', url: '/discover', bg: 'linear-gradient(135deg,#8b5cf6,#2563eb)' },
    { label: 'Logros', sub: 'Insignias y recompensas', icon: 'trophy', url: '/achievements', bg: 'linear-gradient(135deg,#fbbf24,#f97316)' },
    { label: 'Mapa de niveles', sub: 'Tu recorrido GRIT', icon: 'map', url: '/levels', bg: 'linear-gradient(135deg,#2563eb,#1e1b6b)' },
    { label: 'Apoyo emocional', sub: 'Líneas de ayuda', icon: 'shield-checkmark', url: '/support', bg: 'linear-gradient(135deg,#f97316,#ec4899)' },
    { label: 'Evaluación final', sub: 'Validación metodológica', icon: 'clipboard', url: '/evaluation', bg: 'linear-gradient(135deg,#0d9488,#16a34a)', locked: true },
    { label: 'Hablar con el coach', sub: 'Apoyo y organización', icon: 'chatbubble-ellipses', url: '/tabs/chat', bg: 'linear-gradient(135deg,#0ea5e9,#6366f1)' },
  ];

  go(url: string): void {
    void this.nav.navigateForward(url);
  }
}
