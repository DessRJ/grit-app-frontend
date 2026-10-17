import { Component, effect, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { registerIcons } from './icons';
import { GameStore } from './core/game.store';
import { MoodService } from './core/mood.service';
import { RewardOverlayComponent } from './shared/reward-overlay.component';

registerIcons();

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet />
      <app-reward-overlay />
    </ion-app>
  `,
  imports: [IonApp, IonRouterOutlet, RewardOverlayComponent],
})
export class AppComponent {
  private game = inject(GameStore);
  private moods = inject(MoodService);

  constructor() {
    let last = '';
    effect(() => {
      const uid = this.game.state()?.userId ?? '';
      if (uid !== last) {
        last = uid;
        void this.moods.load();
      }
    });
  }
}
