import { Component, computed, inject } from '@angular/core';
import { IonContent, IonIcon, NavController } from '@ionic/angular';
import { GameStore } from '../../core/game.store';
import { HeaderComponent } from '../../shared/header.component';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [IonContent, IonIcon, HeaderComponent, MascotComponent],
  template: `
    <app-header title="Logros" subtitle="Tus insignias y estadísticas" />
    <ion-content class="page">
      <div class="wrap">
        <section class="card grad grad-brand">
          <div class="row"><div class="grow"><small class="op">Nivel actual</small><div class="n">{{ game.level().level }}</div><b>{{ game.level().name }}</b></div><app-mascot mood="happy" [size]="92" [animated]="true" /></div>
          <div class="bar on-dark" style="margin:12px 0 6px"><i [style.width.%]="game.levelPct()"></i></div>
          <p class="small op">{{ game.nextLevel() ? game.xpIntoLevel() + '/' + game.xpNeeded() + ' XP · Siguiente: ' + game.nextLevel()!.name : '¡Nivel máximo alcanzado!' }}</p>
        </section>

        <h2 class="sec">Insignias desbloqueadas ({{ unlocked().length }})</h2>
        <div class="grid2">
          @for (b of unlocked(); track b.id) {
            <div class="badge pop" [style.background]="b.color"><ion-icon [name]="b.icon" /><b>{{ b.name }}</b><small>{{ b.description }}</small></div>
          }
        </div>
        @if (!unlocked().length) { <div class="card flat center muted small">Aún no tienes insignias. ¡Completa tu primer reto!</div> }

        <h2 class="sec">Por desbloquear ({{ locked().length }})</h2>
        <div class="grid2">
          @for (b of locked(); track b.id) {
            <div class="badge off"><ion-icon [name]="b.icon" /><b>{{ b.name }}</b><small>{{ b.description }}</small><span class="chip gray"><ion-icon name="lock-closed" /> Bloqueado</span></div>
          }
        </div>
        <button class="btn ghost block" (click)="nav.navigateForward('/levels')"><ion-icon name="map" /> Ver mapa de niveles</button>
      </div>
    </ion-content>
  `,
  styles: [`
    .n { font-size: 52px; font-weight: 900; line-height: 1; } .op { opacity: .88; } h2.sec { font-size: 18px; margin-top: 6px; }
    .badge { border-radius: 24px; padding: 18px 12px; color: #fff; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; box-shadow: var(--g-shadow-sm); ion-icon { font-size: 34px; margin-bottom: 4px; } b { font-size: 14.5px; } small { opacity: .92; font-weight: 600; font-size: 12px; } }
    .badge.off { background: #fff; color: var(--g-muted); border: 2px dashed #ddd6f5; box-shadow: none; ion-icon { color: #b9b3dd; } }
  `],
})
export class AchievementsPage {
  game = inject(GameStore);
  nav = inject(NavController);
  unlocked = computed(() => this.game.badges().filter((b) => b.unlocked));
  locked = computed(() => this.game.badges().filter((b) => !b.unlocked));
}
