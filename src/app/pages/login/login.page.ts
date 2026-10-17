import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { AiService } from '../../core/ai.service';
import { AuthService } from '../../core/auth.service';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../core/seed';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, MascotComponent],
  template: `
    <ion-content class="page" [fullscreen]="true">
      <div class="lg">
        <div class="head fade-up">
          <app-mascot [mood]="error() ? 'sad' : 'happy'" [size]="120" [animated]="true" />
          <h1 class="title-grad">Inicia sesión</h1>
          <p class="muted">Tu cuenta y tu progreso viven en este dispositivo.</p>
        </div>

        <form class="card form fade-up" (ngSubmit)="submit()" autocomplete="on" novalidate>
          <div class="field">
            <label for="email">Correo electrónico</label>
            <input id="email" name="email" class="input" type="email" inputmode="email" autocomplete="username" placeholder="tucorreo@ejemplo.com" [(ngModel)]="email" />
          </div>
          <div class="field">
            <label for="pw">Contraseña</label>
            <div class="pw">
              <input id="pw" name="password" class="input" [type]="show() ? 'text' : 'password'" autocomplete="current-password" placeholder="Tu contraseña" [(ngModel)]="password" />
              <button type="button" class="eye" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Ocultar contraseña' : 'Mostrar contraseña'"><ion-icon [name]="show() ? 'eye-off-outline' : 'eye-outline'" /></button>
            </div>
          </div>
          @if (error()) { <p class="hint err" role="alert">{{ error() }}</p> }
          <button class="btn xl block" type="submit" [disabled]="busy()">
            @if (busy()) { Entrando… } @else { Iniciar sesión }
          </button>
        </form>
        @if (ai.configured) {
          <p class="xs muted center"><ion-icon name="shield-checkmark-outline" /> Al usar el chat o fotos con internet, un tercero (Google Gemini) procesa ese texto o imagen de forma anónima, sin tu nombre, correo ni identificadores. Puedes desactivarlo en Perfil. Sin internet todo es local.</p>
        }

        <div class="card flat demo fade-up">
          <div class="row between">
            <b class="small">Cuentas de demostración</b>
            <span class="chip gray">Contraseña: {{ pw }}</span>
          </div>
          @for (a of accounts; track a.id) {
            <button type="button" class="acc" (click)="fill(a.email)">
              <span class="av" [class.m]="a.kind === 'master'"><ion-icon [name]="a.kind === 'master' ? 'trophy' : 'sparkles'" /></span>
              <span class="grow"><b>{{ a.displayName }}</b><br /><span class="xs muted">{{ a.profileLabel }} · {{ a.email }}</span></span>
              <ion-icon name="arrow-forward" />
            </button>
          }
          <p class="xs muted">Toca una cuenta para autocompletar el correo y la contraseña.</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .lg { padding: 36px 22px 32px; display: flex; flex-direction: column; gap: 18px; }
    .head { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; } h1 { font-size: 32px; }
    .form { display: flex; flex-direction: column; gap: 14px; }
    .pw { position: relative; } .pw .input { padding-right: 52px; }
    .eye { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: 0; font-size: 22px; color: var(--g-muted); padding: 8px; cursor: pointer; }
    .demo { display: flex; flex-direction: column; gap: 10px; background: #faf8ff; }
    .acc { display: flex; align-items: center; gap: 12px; background: #fff; border: 1.5px solid #e6e0fb; border-radius: 18px; padding: 10px 14px; font: inherit; text-align: left; color: var(--g-ink); cursor: pointer; &:active { transform: scale(.98); } }
    .av { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: var(--g-grad-ocean); color: #fff; font-size: 20px; flex-shrink: 0; } .av.m { background: var(--g-grad-sunset); }
  `],
})
export class LoginPage {
  ai = inject(AiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  email = '';
  password = '';
  show = signal(false);
  busy = signal(false);
  error = signal('');
  accounts = DEMO_ACCOUNTS;
  pw = DEMO_PASSWORD;

  fill(email: string): void {
    this.email = email;
    this.password = DEMO_PASSWORD;
    this.error.set('');
  }

  async submit(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    const r = await this.auth.signIn(this.email, this.password);
    this.busy.set(false);
    if (r.ok) await this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    else this.error.set(r.error ?? 'No se pudo iniciar sesión.');
  }
}
