import { Component, effect, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { GameStore } from '../core/game.store';
import { MascotComponent } from './mascot.component';

@Component({
  selector: 'app-reward-overlay',
  standalone: true,
  imports: [MascotComponent, IonIcon],
  template: `
    @if (game.reward(); as r) {
      <div class="toast pop" role="status" aria-live="polite">
        <app-mascot mood="happy" [size]="52" />
        <div class="txt">
          <b>¡Reto completado!</b>
          <span>{{ r.title }}</span>
        </div>
        <div class="xp"><ion-icon name="flash" />+{{ r.xp }} XP</div>
      </div>
    }
    @if (game.levelUp(); as l) {
      <div class="lvl" role="dialog" aria-modal="true" aria-label="Nuevo nivel desbloqueado">
        <div class="confetti" aria-hidden="true">
          @for (c of confetti; track $index) { <i [style.left.%]="c.x" [style.animation-delay.s]="c.d" [style.background]="c.c"></i> }
        </div>
        <div class="box pop">
          <app-mascot mood="happy" [size]="110" [animated]="true" />
          <div class="stars"><ion-icon name="star" /><ion-icon name="star" class="big" /><ion-icon name="star" /></div>
          <small>¡NUEVO NIVEL DESBLOQUEADO!</small>
          <h2>Nivel {{ l.level }}</h2>
          <h3>{{ l.name }}</h3>
          <div class="xpb"><ion-icon name="flash" /> {{ game.xp().toLocaleString('es-MX') }} XP acumulados</div>
          <button class="btn light block xl" (click)="game.acknowledgeLevelUp()">Continuar</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .toast { position: fixed; z-index: 9000; top: calc(env(safe-area-inset-top) + 12px); left: 0; right: 0; margin: 0 auto; width: min(92vw, 480px); display: flex; align-items: center; gap: 10px; background: linear-gradient(135deg,#1e1b6b,#6d28d9); color: #fff; padding: 10px 16px 10px 10px; border-radius: 22px; box-shadow: 0 14px 34px rgba(30,27,107,.45); }
    .toast .txt { flex: 1; display: flex; flex-direction: column; min-width: 0; font-size: 13px; }
    .toast .txt b { font-size: 15px; } .toast .txt span { opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .xp { display: flex; align-items: center; gap: 4px; font-weight: 900; background: rgba(255,255,255,.18); padding: 6px 12px; border-radius: 999px; }
    .lvl { position: fixed; inset: 0; z-index: 9500; background: radial-gradient(circle at 50% 30%, #4c1d95, #1e1b6b 70%); display: grid; place-items: center; padding: 22px; overflow: hidden; }
    .box { position: relative; z-index: 2; width: min(100%, 380px); text-align: center; color: #fff; background: linear-gradient(160deg,#7c3aed,#2563eb); border-radius: 32px; padding: 26px 22px 22px; box-shadow: 0 24px 60px rgba(0,0,0,.45); display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .stars { display: flex; gap: 6px; align-items: center; color: #facc15; font-size: 26px; margin-top: 4px; } .stars .big { font-size: 38px; }
    small { letter-spacing: 2px; font-weight: 800; opacity: .85; font-size: 11.5px; margin-top: 6px; }
    h2 { font-size: 42px; margin: 0; } h3 { color: #fde047; font-size: 24px; margin-bottom: 8px; }
    .xpb { background: rgba(255,255,255,.18); padding: 10px 18px; border-radius: 16px; font-weight: 800; margin-bottom: 14px; display: flex; gap: 6px; align-items: center; }
    .confetti { position: absolute; inset: 0; pointer-events: none; }
    .confetti i { position: absolute; top: -20px; width: 9px; height: 16px; border-radius: 3px; animation: fall 3.6s linear infinite; }
    @keyframes fall { to { transform: translateY(110vh) rotate(720deg); } }
  `],
})
export class RewardOverlayComponent {
  game = inject(GameStore);
  confetti = Array.from({ length: 36 }, (_, i) => ({
    x: (i * 53) % 100,
    d: (i % 12) * 0.28,
    c: ['#facc15', '#fb923c', '#ec4899', '#38bdf8', '#34d399', '#a78bfa'][i % 6],
  }));

  constructor() {
    effect(() => {
      const r = this.game.reward();
      if (r) setTimeout(() => this.game.reward.set(null), 3400);
    });
  }
}
