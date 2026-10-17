import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { QUOTES, Quote } from '../../core/content';
import { ls } from '../../core/util';
import { MascotComponent } from '../../shared/mascot.component';

const LAST_QUOTE = 'gritai.lastQuote';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [IonContent, MascotComponent],
  template: `
    <ion-content class="page" [fullscreen]="true" (click)="go()">
      <div class="splash">
        <div class="quote fade-up">
          <p class="q">“{{ quote.text }}”</p>
          @if (quote.author) { <p class="a">— {{ quote.author }}</p> }
        </div>
        <div class="foot">
          <div class="track" role="progressbar" aria-label="Cargando" [attr.aria-valuenow]="pct()">
            <div class="fill" [style.width.%]="pct()"></div>
            <div class="runner" [style.left.%]="pct()"><app-mascot mood="happy" [size]="54" /></div>
          </div>
          <img class="logo" src="assets/img/logo.png" alt="GritAI" />
          <p class="tag">Disciplina hoy, resultados mañana.</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .splash { min-height: 100%; height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 12vh 28px 6vh; background: linear-gradient(170deg,#fbf9ff 0%,#f1ecff 55%,#ffeedd 100%); }
    .q { font-size: clamp(26px, 7.4vw, 34px); line-height: 1.28; font-weight: 900; color: #5b2fb8; }
    .a { margin-top: 10px; text-align: right; font-size: 18px; font-weight: 600; color: #8a6bc6; }
    .foot { display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .track { position: relative; width: 100%; height: 14px; border-radius: 999px; background: #e5defa; margin-top: 52px; }
    .fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#ff8a1f,#ec4899,#7c3aed); transition: width .12s linear; }
    .runner { position: absolute; bottom: 10px; transform: translateX(-50%); transition: left .12s linear; }
    .logo { width: min(48vw, 210px); height: auto; margin-top: 8px; }
    .tag { font-size: 13px; font-weight: 800; color: #7c3aed; letter-spacing: .4px; }
  `],
})
export class SplashPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  quote: Quote = this.pickQuote();
  pct = signal(0);
  private timer?: ReturnType<typeof setInterval>;
  private done = false;

  private pickQuote(): Quote {
    const last = Number(ls.get(LAST_QUOTE) ?? -1);
    let i = Math.floor(Math.random() * QUOTES.length);
    if (i === last) i = (i + 1) % QUOTES.length;
    ls.set(LAST_QUOTE, String(i));
    return QUOTES[i];
  }

  ngOnInit(): void {
    const start = Date.now();
    const total = 3200;
    this.timer = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / total) * 100);
      this.pct.set(Math.round(p));
      if (p >= 100) this.go();
    }, 90);
  }

  go(): void {
    if (this.done) return;
    this.done = true;
    clearInterval(this.timer);
    const target = this.auth.isLoggedIn() ? '/tabs/home' : this.auth.onboardingDone ? '/login' : '/onboarding';
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
