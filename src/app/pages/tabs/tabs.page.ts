import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home"><ion-icon name="home" /><ion-label>Inicio</ion-label></ion-tab-button>
        <ion-tab-button tab="challenges"><ion-icon name="flag" /><ion-label>Retos</ion-label></ion-tab-button>
        <ion-tab-button tab="focus"><ion-icon name="timer" /><ion-label>Enfoque</ion-label></ion-tab-button>
        <ion-tab-button tab="chat"><ion-icon name="chatbubble-ellipses" /><ion-label>Coach</ion-label></ion-tab-button>
        <ion-tab-button tab="profile"><ion-icon name="person" /><ion-label>Perfil</ion-label></ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {}
