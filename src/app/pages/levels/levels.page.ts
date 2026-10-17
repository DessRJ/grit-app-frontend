import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { levelXPTotal } from '../../core/challenges.data';
import { GameStore } from '../../core/game.store';
import { LEVELS } from '../../core/levels';
import { HeaderComponent } from '../../shared/header.component';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-levels',
  standalone: true,
  imports: [IonContent, IonIcon, DecimalPipe, HeaderComponent, MascotComponent],
  template: `
    <app-header title="Mapa de niveles" subtitle="Tu recorrido en GritAI" />
    <ion-content class="page">
      <div class="wrap">
        <section class="card grad grad-brand row">
          <app-mascot mood="happy" [size]="76" [animated]="true" />
          <div class="grow"><small class="op">Tu nivel actual</small><h2>{{ game.level().name }}</h2><p class="small op">{{ game.xp() | number }} XP acumulados</p></div>
        </section>
        <div class="path">
          @for (l of levels; track l.level) {
            <div class="step" [class.done]="l.level < game.level().level" [class.cur]="l.level === game.level().level" [class.lock]="l.level > game.level().level">
              <div class="dot"><ion-icon [name]="l.level < game.level().level ? 'checkmark' : l.level === game.level().level ? 'star' : 'lock-closed'" /></div>
              <div class="box card flat">
                <div class="row between"><small class="bold lv">NIVEL {{ l.level }}</small>
                  @if (l.level < game.level().level) { <span class="chip green">Completado</span> } @else if (l.level === game.level().level) { <span class="chip">Actual</span> } @else { <span class="chip gray">Bloqueado</span> }</div>
                <b>{{ l.name }}</b>
                <p class="xs muted">{{ l.xpRequired | number }} XP requeridos · 8 retos ({{ xpOf(l.level) | number }} XP)</p>
                @if (l.level === game.level().level && game.nextLevel()) { <p class="xs bold" style="color:var(--g-purple)">Te faltan {{ game.xpMissing() | number }} XP para el siguiente nivel</p> }
                @if (l.level === game.level().level && !game.nextLevel()) { <p class="xs bold" style="color:var(--g-purple)">¡Alcanzaste la cima del recorrido!</p> }
              </div>
            </div>
          }
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .op { opacity: .88; } h2 { font-size: 22px; }
    .path { position: relative; display: flex; flex-direction: column; gap: 14px; padding-left: 6px; }
    .path::before { content: ''; position: absolute; left: 29px; top: 20px; bottom: 20px; width: 4px; background: #e3dcfa; border-radius: 4px; }
    .step { display: flex; gap: 14px; align-items: flex-start; position: relative; }
    .dot { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; font-size: 22px; flex-shrink: 0; background: #fff; border: 3px solid #e3dcfa; color: #b9b3dd; z-index: 1; }
    .done .dot { background: #bbf7d0; border-color: #4ade80; color: #047857; } .cur .dot { background: var(--g-grad-brand); border-color: #c4b5fd; color: #fff; box-shadow: 0 0 0 6px rgba(124,58,237,.15); }
    .box { flex: 1; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; } .done .box { background: #f1fbf6; border-color: #bbf7d0; } .cur .box { border-color: var(--g-violet); background: #fff; } .lock .box { opacity: .65; }
    .lv { color: var(--g-purple); font-size: 11px; letter-spacing: 1px; }
  `],
})
export class LevelsPage {
  game = inject(GameStore);
  levels = LEVELS;
  xpOf = levelXPTotal;
}
