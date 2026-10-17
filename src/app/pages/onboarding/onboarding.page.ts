import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { MoodKey } from '../../core/models';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [IonContent, IonIcon, MascotComponent],
  template: `
    <ion-content class="page" [fullscreen]="true">
      <div class="ob">
        <button class="skip" (click)="finish()">Omitir</button>
        @for (s of slides; track $index) {
          @if ($index === i()) {
            <div class="slide fade-up">
              <div class="bubble"><app-mascot [mood]="s.mood" [size]="190" [animated]="true" /></div>
              <h1 class="title-grad">{{ s.title }}</h1>
              <p class="muted">{{ s.text }}</p>
            </div>
          }
        }
        <div class="bottom">
          <div class="dots" aria-hidden="true">
            @for (s of slides; track $index) { <i [class.on]="$index === i()"></i> }
          </div>
          @if (i() < slides.length - 1) {
            <button class="btn xl block" (click)="next()">Siguiente <ion-icon name="arrow-forward" /></button>
          } @else {
            <button class="btn orange xl block" (click)="finish()">Comenzar</button>
          }
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .ob { min-height: 100%; height: 100vh; display: flex; flex-direction: column; padding: 56px 26px 34px; position: relative; }
    .skip { position: absolute; right: 22px; top: 22px; background: none; border: 0; font: inherit; font-weight: 800; color: var(--g-muted); font-size: 15px; padding: 8px; cursor: pointer; }
    .slide { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 14px; }
    .bubble { width: 250px; height: 250px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff, #ece4ff 70%); display: grid; place-items: center; box-shadow: var(--g-shadow); margin-bottom: 14px; }
    h1 { font-size: 34px; line-height: 1.12; } p { font-size: 17px; max-width: 310px; line-height: 1.45; font-weight: 600; }
    .bottom { display: flex; flex-direction: column; gap: 20px; align-items: center; }
    .dots { display: flex; gap: 8px; } .dots i { width: 9px; height: 9px; border-radius: 99px; background: #d9d1f5; transition: all .25s; } .dots i.on { width: 30px; background: var(--g-purple); }
  `],
})
export class OnboardingPage {
  private router = inject(Router);
  private auth = inject(AuthService);
  i = signal(0);
  slides: { title: string; text: string; mood: MoodKey }[] = [
    { title: 'Construye disciplina diaria', text: 'Pequeños pasos cada día te llevan a grandes resultados.', mood: 'happy' },
    { title: 'Entiende tus emociones', text: 'Registra cómo te sientes y descubre patrones que te ayuden a crecer.', mood: 'normal' },
    { title: 'Conquista tus metas', text: 'Completa retos, gana recompensas y conviértete en tu mejor versión.', mood: 'happy' },
  ];
  next(): void { this.i.update((n) => Math.min(this.slides.length - 1, n + 1)); }
  finish(): void {
    this.auth.markOnboardingDone();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
