import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, NavController } from '@ionic/angular';
import { CHALLENGES, Challenge, challengesOfLevel, levelXPTotal } from '../../core/challenges.data';
import { GameStore } from '../../core/game.store';
import { LEVELS } from '../../core/levels';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [IonContent, IonIcon, MascotComponent],
  template: `
    <ion-content class="page">
      <div class="wrap wrap-tabs">
        <header class="hd row fade-up">
          <div class="grow"><h1 class="title-grad">Retos</h1><p class="muted bold">Nivel {{ game.level().level }} · {{ game.level().name }}</p></div>
          <app-mascot mood="happy" [size]="64" [animated]="true" />
        </header>

        <section class="card grad grad-sunset fade-up">
          <div class="row between"><small class="op">XP DE ESTE NIVEL</small><span class="chip white">{{ game.levelDoneCount() }}/{{ total().length }} retos</span></div>
          <div class="big">{{ earned() }} <span>/ {{ levelTotal() }} XP</span></div>
          <div class="bar on-dark"><i [style.width.%]="(game.levelDoneCount() / total().length) * 100"></i></div>
        </section>

        @for (c of total(); track c.id) {
          <button class="card tap ch" [class.done]="game.isDone(c.id)" [class.next]="game.featured()?.id === c.id" (click)="open(c)">
            <div class="ico" [class.ok]="game.isDone(c.id)"><ion-icon [name]="game.isDone(c.id) ? 'checkmark' : c.icon" /></div>
            <div class="grow tx">
              <b>{{ c.n }}. {{ c.name }}</b>
              <p class="xs muted">{{ c.mech }}</p>
              <div class="row chips">
                <span class="chip blue"><ion-icon name="flash" />{{ c.xp }} XP</span>
                <span class="chip gray"><ion-icon name="time-outline" />{{ time(c) }}</span>
                <span class="chip orange">{{ c.difficulty }}</span>
                @if (game.featured()?.id === c.id) { <span class="chip green">Siguiente</span> }
              </div>
            </div>
            <ion-icon name="chevron-forward" class="chev" />
          </button>
        }

        <h2 class="sec">Próximos niveles</h2>
        @for (l of upcoming(); track l.level) {
          <div class="card flat lock">
            <div class="row"><div class="ico off"><ion-icon name="lock-closed" /></div><div class="grow"><b>Nivel {{ l.level }} · {{ l.name }}</b><p class="xs muted">8 retos · {{ xpOf(l.level) }} XP · se desbloquea con {{ l.xpRequired.toLocaleString('es-MX') }} XP</p></div></div>
          </div>
        }
        @if (!upcoming().length) { <div class="card flat center muted small">Estás en el nivel más alto. ¡Completa los retos finales!</div> }

        @if (past().length) {
          <h2 class="sec">Niveles completados</h2>
          @for (l of past(); track l.level) {
            <button class="card flat tap" (click)="togglePast(l.level)">
              <div class="row"><div class="ico ok"><ion-icon name="checkmark" /></div><div class="grow tl"><b>Nivel {{ l.level }} · {{ l.name }}</b><p class="xs muted">{{ xpOf(l.level) }} XP · 8/8 retos</p></div><ion-icon [name]="openPast() === l.level ? 'chevron-up' : 'chevron-down'" /></div>
            </button>
            @if (openPast() === l.level) {
              @for (c of byLevel(l.level); track c.id) {
                <button class="sub" (click)="open(c)"><ion-icon name="checkmark-circle" /> {{ c.n }}. {{ c.name }} <span>+{{ c.xp }} XP</span></button>
              }
            }
          }
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .hd { padding-top: 18px; } h1 { font-size: 30px; } .op { opacity: .9; font-weight: 800; letter-spacing: 1.2px; font-size: 11px; }
    .big { font-size: 38px; font-weight: 900; margin: 6px 0 10px; } .big span { font-size: 16px; opacity: .85; }
    .ch { display: flex; align-items: center; gap: 12px; text-align: left; font: inherit; color: var(--g-ink); width: 100%; } .ch.done { background: #f1fbf6; border-color: #bbf7d0; } .ch.next { border-color: var(--g-violet); box-shadow: 0 8px 24px rgba(124,58,237,.2); }
    .ico { width: 48px; height: 48px; border-radius: 16px; flex-shrink: 0; background: #f1ecff; color: var(--g-purple); display: grid; place-items: center; font-size: 25px; } .ico.ok { background: #bbf7d0; color: #047857; } .ico.off { background: #eceaf5; color: #9a96bd; }
    .tx b { font-size: 16px; } .tx p { margin: 3px 0 7px; line-height: 1.35; } .chips { gap: 6px; flex-wrap: wrap; } .chev { color: #b9b3dd; font-size: 20px; }
    h2.sec { font-size: 18px; margin-top: 6px; } .lock { opacity: .8; } .tl { text-align: left; }
    .sub { display: flex; align-items: center; gap: 8px; background: #fff; border: 0; border-radius: 14px; padding: 11px 14px; font: inherit; font-weight: 700; font-size: 14px; color: var(--g-ink); margin-left: 14px; box-shadow: var(--g-shadow-sm); cursor: pointer; ion-icon { color: var(--g-green); font-size: 20px; } span { margin-left: auto; color: var(--g-muted); font-size: 12px; } }
  `],
})
export class ChallengesPage {
  game = inject(GameStore);
  private nav = inject(NavController);
  openPast = signal(0);

  total = computed(() => challengesOfLevel(this.game.level().level));
  levelTotal = computed(() => levelXPTotal(this.game.level().level));
  earned = computed(() => this.total().filter((c) => this.game.isDone(c.id)).reduce((a, c) => a + c.xp, 0));
  upcoming = computed(() => LEVELS.filter((l) => l.level > this.game.level().level));
  past = computed(() => LEVELS.filter((l) => l.level < this.game.level().level));

  xpOf = levelXPTotal;
  byLevel(l: number): Challenge[] { return CHALLENGES.filter((c) => c.level === l); }
  time(c: Challenge): string { return c.minutes === 0 ? 'Varios días' : c.minutes >= 60 ? `${Math.round((c.minutes / 60) * 10) / 10} h` : `${c.minutes} min`; }
  togglePast(l: number): void { this.openPast.update((v) => (v === l ? 0 : l)); }
  open(c: Challenge): void { void this.nav.navigateForward('/challenge/' + c.id); }
}
