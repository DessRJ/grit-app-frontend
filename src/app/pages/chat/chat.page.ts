import { Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, NavController } from '@ionic/angular';
import { AiService } from '../../core/ai.service';
import { ChatService } from '../../core/chat.service';
import { QUOTES } from '../../core/content';
import { ChatButton } from '../../core/models';
import { fmtTime, pick } from '../../core/util';
import { BreathingComponent } from '../../shared/breathing.component';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, MascotComponent, BreathingComponent],
  template: `
    <div class="top">
      <app-mascot mood="happy" [size]="48" />
      <div class="grow"><b>Tu coach GritAI</b><br /><span class="xs muted">Siempre aquí para ti · {{ ai.active ? 'IA activa · anónima' : 'responde sin conexión' }}</span></div>
      <button class="icon-btn" (click)="clear()" aria-label="Borrar conversación"><ion-icon name="trash-outline" /></button>
    </div>
    <ion-content class="page" #content>
      <div class="msgs">
        @for (m of chat.messages(); track m.id; let last = $last) {
          <div class="m" [class.user]="m.role === 'user'">
            @if (m.role === 'bot') { <app-mascot mood="normal" [size]="34" /> }
            <div class="b">
              <p>{{ m.text }}</p>
              <span class="tm">{{ time(m.t) }}</span>
            </div>
          </div>
          @if (last && m.role === 'bot' && m.buttons?.length) {
            <div class="qb">
              @for (b of m.buttons; track b.label) { <button class="q" (click)="act(b)">{{ b.label }}</button> }
            </div>
          }
        }
        @if (chat.typing()) { <div class="m"><app-mascot mood="normal" [size]="34" /><div class="b typing"><i></i><i></i><i></i></div></div> }
      </div>
    </ion-content>
    <form class="in" (ngSubmit)="send()">
      <input class="input" name="msg" [(ngModel)]="text" placeholder="Escribe tu mensaje…" autocomplete="off" aria-label="Mensaje" />
      <button class="send" type="submit" aria-label="Enviar" [disabled]="!text.trim()"><ion-icon name="send" /></button>
    </form>

    @if (breathing()) {
      <div class="ov" (click)="breathing.set(false)">
        <div class="card sheet" (click)="$event.stopPropagation()">
          <h3>Respiración 4-4-4</h3>
          <app-breathing [minutes]="1" (done)="breathing.set(false)" />
          <button class="btn ghost block" (click)="breathing.set(false)">Cerrar</button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; position: relative; }
    .top { display: flex; align-items: center; gap: 10px; padding: calc(env(safe-area-inset-top) + 10px) 16px 10px; background: #fff; box-shadow: 0 2px 14px rgba(76,54,170,.08); z-index: 2; }
    ion-content { flex: 1; --padding-bottom: 8px; }
    .msgs { padding: 14px 14px 12px; display: flex; flex-direction: column; gap: 10px; }
    .m { display: flex; align-items: flex-end; gap: 8px; max-width: 88%; animation: fadeUp .3s both; } .m.user { align-self: flex-end; flex-direction: row-reverse; }
    .b { background: #fff; border-radius: 20px 20px 20px 6px; padding: 11px 14px; box-shadow: var(--g-shadow-sm); font-size: 15.5px; line-height: 1.45; white-space: pre-line; }
    .user .b { background: var(--g-grad-brand); color: #fff; border-radius: 20px 20px 6px 20px; }
    .tm { display: block; font-size: 10.5px; opacity: .55; text-align: right; margin-top: 3px; }
    .qb { display: flex; flex-wrap: wrap; gap: 8px; padding-left: 42px; } .q { border: 2px solid #d9c8ff; background: #fff; color: var(--g-purple); font: inherit; font-weight: 800; font-size: 13.5px; padding: 8px 14px; border-radius: 999px; cursor: pointer; &:active { background: #f3edff; } }
    .typing { display: flex; gap: 5px; padding: 14px 16px; } .typing i { width: 8px; height: 8px; border-radius: 50%; background: #b7a6ea; animation: float .9s infinite; } .typing i:nth-child(2) { animation-delay: .15s; } .typing i:nth-child(3) { animation-delay: .3s; }
    .in { display: flex; gap: 10px; padding: 10px 14px calc(76px + env(safe-area-inset-bottom)); background: #f6f4ff; position: relative; z-index: 3; }
    .in .input { border-radius: 999px; } .send { width: 50px; height: 50px; border-radius: 50%; border: 0; background: var(--g-grad-brand); color: #fff; font-size: 21px; display: grid; place-items: center; flex-shrink: 0; cursor: pointer; &:disabled { opacity: .4; } }
    .ov { position: fixed; inset: 0; z-index: 8000; background: rgba(30,27,107,.55); display: grid; place-items: end center; padding: 12px; }
    .sheet { width: min(100%, 480px); border-radius: 30px 30px 24px 24px; display: flex; flex-direction: column; gap: 10px; text-align: center; animation: fadeUp .3s both; }
  `],
})
export class ChatPage {
  chat = inject(ChatService);
  ai = inject(AiService);
  private nav = inject(NavController);
  @ViewChild('content') content!: { scrollToBottom: (ms?: number) => Promise<void> };
  text = '';
  breathing = signal(false);

  constructor() {
    void this.chat.load();
    effect(() => {
      this.chat.messages();
      this.chat.typing();
      setTimeout(() => this.content?.scrollToBottom(250), 60);
    });
  }

  time = fmtTime;

  async send(): Promise<void> {
    const t = this.text;
    this.text = '';
    await this.chat.send(t);
  }

  async act(b: ChatButton): Promise<void> {
    const a = b.action;
    if (a.startsWith('tel:')) { window.location.href = a; return; }
    if (a.startsWith('route:')) { void this.nav.navigateForward(a.slice(6)); return; }
    if (a === 'breathe') { this.breathing.set(true); return; }
    await this.chat.runAction(b.label, a);
  }

  async clear(): Promise<void> {
    await this.chat.clear();
  }
}
