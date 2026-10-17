import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { HOTLINES, SUPPORT_CONTACTS, formatPhone } from '../../core/content';
import { GameStore } from '../../core/game.store';
import { ls } from '../../core/util';
import { HeaderComponent } from '../../shared/header.component';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, HeaderComponent, MascotComponent],
  template: `
    <app-header title="Apoyo emocional" subtitle="Recursos de ayuda en Coahuila y México" />
    <ion-content class="page">
      <div class="wrap">
        <section class="card center hero fade-up">
          <app-mascot mood="sad" [size]="110" />
          <h2>No estás solo</h2>
          <p class="muted">Estamos aquí para apoyarte. Si necesitas ayuda, estos recursos están disponibles.</p>
        </section>

        <h3 class="sec">Líneas de atención inmediata y gratuita</h3>
        @for (h of hotlines; track h.phone) {
          <div class="card row hot">
            <div class="ic"><ion-icon name="call" /></div>
            <div class="grow"><b>{{ h.name }}</b><p class="small muted">{{ h.display }}{{ h.email ? ' · ' + h.email : '' }}</p></div>
            <a class="btn sm" [href]="'tel:' + h.phone">Llamar</a>
          </div>
        }

        <h3 class="sec">Centros de atención psicológica</h3>
        @for (city of cities; track city) {
          <small class="muted bold city">{{ city.toUpperCase() }}</small>
          @for (c of byCity(city); track c.phone) {
            <div class="card center-c">
              <div class="row">
                <div class="ic blue"><ion-icon name="business" /></div>
                <div class="grow"><b>{{ c.name }}</b></div>
              </div>
              @if (c.address) { <p class="small muted"><ion-icon name="location-outline" /> {{ c.address }}</p> }
              <div class="row wrapflex">
                <a class="btn sm" [href]="'tel:' + c.phone"><ion-icon name="call" /> {{ fmt(c.phone) }}</a>
                @if (c.email) { <a class="btn ghost sm" [href]="'mailto:' + c.email"><ion-icon name="mail" /> Correo</a> }
                @if (c.address) { <a class="btn ghost sm" target="_blank" rel="noopener" [href]="'https://www.google.com/maps/search/?api=1&query=' + enc(c.name + ' ' + c.address)"><ion-icon name="navigate" /> Mapa</a> }
              </div>
            </div>
          }
        }

        <h3 class="sec">Mi contacto de confianza</h3>
        <section class="card col">
          <p class="small muted">Guarda a un familiar o amigo al que puedas llamar. Solo se guarda en este dispositivo.</p>
          <div class="field"><label for="tn">Nombre</label><input id="tn" class="input" [(ngModel)]="tName" placeholder="Ej. Mamá" (ngModelChange)="saveTrusted()" /></div>
          <div class="field"><label for="tp">Teléfono</label><input id="tp" class="input" inputmode="tel" [(ngModel)]="tPhone" placeholder="10 dígitos" (ngModelChange)="saveTrusted()" /></div>
          @if (tPhone.length >= 8) { <a class="btn green" [href]="'tel:' + tPhone"><ion-icon name="call" /> Llamar a {{ tName || 'mi contacto' }}</a> }
        </section>

        <p class="xs muted center disc"><ion-icon name="information-circle-outline" /> Esta aplicación no sustituye atención psicológica profesional. Si estás en peligro inmediato, llama al 911.</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .hero { background: linear-gradient(160deg,#f3edff,#fff); display: flex; flex-direction: column; align-items: center; gap: 6px; } h2 { color: var(--g-purple); font-size: 26px; }
    h3.sec { font-size: 16px; margin-top: 6px; } .city { letter-spacing: 1px; margin-bottom: -6px; }
    .ic { width: 44px; height: 44px; border-radius: 15px; background: #dcfce7; color: #059669; display: grid; place-items: center; font-size: 22px; flex-shrink: 0; } .ic.blue { background: #dbeafe; color: #2563eb; }
    .center-c { display: flex; flex-direction: column; gap: 10px; } a.btn { text-decoration: none; }
    .disc { padding: 6px 10px 0; line-height: 1.5; }
  `],
})
export class SupportPage {
  private game = inject(GameStore);
  hotlines = HOTLINES;
  cities = [...new Set(SUPPORT_CONTACTS.map((c) => c.city))];
  tName = '';
  tPhone = '';
  private key = computed(() => 'gritai.trusted.' + (this.game.state()?.userId ?? ''));

  constructor() {
    try {
      const raw = ls.get(this.key());
      if (raw) {
        const o = JSON.parse(raw);
        this.tName = o.name ?? '';
        this.tPhone = o.phone ?? '';
      }
    } catch { /* sin datos */ }
  }

  byCity(c: string) { return SUPPORT_CONTACTS.filter((x) => x.city === c); }
  fmt = formatPhone;
  enc = encodeURIComponent;
  saveTrusted(): void { ls.set(this.key(), JSON.stringify({ name: this.tName, phone: this.tPhone })); }
}
