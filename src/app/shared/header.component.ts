import { Component, Input } from '@angular/core';
import { IonBackButton, IonButtons, IonHeader, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button [defaultHref]="backHref" text="" icon="arrow-back" /></ion-buttons>
        <div class="t">
          <h1 [class.grad]="grad">{{ title }}</h1>
          @if (subtitle) { <p>{{ subtitle }}</p> }
        </div>
        <div slot="end" class="end"><ng-content /></div>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    ion-toolbar { --min-height: 64px; --padding-end: 14px; }
    ion-back-button { --color: var(--g-purple); --icon-font-size: 24px; }
    .t { padding: 6px 4px; } h1 { font-size: 23px; line-height: 1.1; } h1.grad { background: var(--g-grad-brand); -webkit-background-clip: text; background-clip: text; color: transparent; }
    p { font-size: 13px; color: var(--g-muted); font-weight: 600; margin-top: 2px; }
    .end { display: flex; align-items: center; }
  `],
})
export class HeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() backHref = '/tabs/home';
  @Input() grad = true;
}
