import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonContent, IonIcon, NavController } from '@ionic/angular';
import { AiService } from '../../core/ai.service';
import { AuthService } from '../../core/auth.service';
import { ChatService } from '../../core/chat.service';
import { DbService } from '../../core/db.service';
import { GameStore } from '../../core/game.store';
import { MoodService } from '../../core/mood.service';
import { PwaService } from '../../core/pwa.service';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, DecimalPipe, MascotComponent],
  template: `
    <ion-content class="page">
      <div class="wrap wrap-tabs">
        <section class="card grad grad-brand center fade-up hero">
          <app-mascot mood="happy" [size]="120" [animated]="true" />
          <div class="nm">
            @if (!editing()) {
              <h1>{{ game.name() }}</h1><button class="ed" (click)="startEdit()" aria-label="Editar nombre"><ion-icon name="pencil" /></button>
            } @else {
              <input class="input" [(ngModel)]="nameEdit" maxlength="24" (keyup.enter)="saveName()" aria-label="Nombre" /><button class="ed ok" (click)="saveName()" aria-label="Guardar nombre"><ion-icon name="checkmark" /></button>
            }
          </div>
          <p class="op">Nivel {{ game.level().level }} · {{ game.level().name }}</p>
          <div class="bar on-dark" style="margin-top:10px"><i [style.width.%]="game.levelPct()"></i></div>
          <p class="xs op" style="margin-top:6px">{{ game.nextLevel() ? 'Faltan ' + (game.xpMissing() | number) + ' XP para «' + game.nextLevel()!.name + '»' : '¡Maestría Grit alcanzada!' }}</p>
          <span class="chip white" style="margin-top:6px">{{ auth.user()?.email }}</span>
        </section>

        <div class="grid2">
          <div class="stat"><ion-icon name="flag" style="color:var(--g-orange)" /><b>{{ game.completedCount() }}</b><span>Retos completados</span></div>
          <div class="stat"><ion-icon name="timer" style="color:var(--g-blue)" /><b>{{ game.state()?.focusSessions ?? 0 }}</b><span>Sesiones de enfoque</span></div>
        </div>

        <div class="list card flat">
          <button (click)="go('/levels')"><ion-icon name="map" /><span>Mapa de niveles</span><ion-icon name="chevron-forward" /></button>
          <button (click)="go('/achievements')"><ion-icon name="trophy" /><span>Logros</span><ion-icon name="chevron-forward" /></button>
          <button (click)="go('/progress')"><ion-icon name="stats-chart" /><span>Mi progreso</span><ion-icon name="chevron-forward" /></button>
          <button (click)="go('/discover')"><ion-icon name="bulb" /><span>Descubre el GRIT</span><ion-icon name="chevron-forward" /></button>
          <button (click)="go('/evaluation')"><ion-icon [name]="game.isMaster() ? 'clipboard' : 'lock-closed'" /><span>Evaluación final</span>@if (!game.isMaster()) { <span class="chip gray">Nivel 8</span> }<ion-icon name="chevron-forward" /></button>
          <button (click)="go('/support')"><ion-icon name="heart" /><span>Apoyo emocional</span><ion-icon name="chevron-forward" /></button>
        </div>

        <h2 class="sec">Ajustes</h2>
        <div class="list card flat">
          <label class="opt"><ion-icon name="volume-high" /><span class="grow">Sonido y vibración al terminar bloques</span><input type="checkbox" [ngModel]="game.state()?.settings?.sound" (ngModelChange)="setSetting('sound', $event)" /></label>
          @if (ai.configured) {
            <label class="opt"><ion-icon name="sparkles" /><span class="grow">IA en la nube (Gemini)<br /><span class="xs muted">Ayuda a revisar fotos y a responder en el chat lo que no está predefinido. Solo se envía el texto o la imagen de ese momento, sin tu nombre ni correo y sin identificadores; un tercero (Google) la procesa. Sin internet todo sigue funcionando en tu dispositivo.</span></span><input type="checkbox" [ngModel]="game.state()?.settings?.ai !== false" (ngModelChange)="setSetting('ai', $event)" /></label>
          }
          <label class="opt"><ion-icon name="flask" /><span class="grow">Modo demostración<br /><span class="xs muted">Acelera x60 los temporizadores, ignora horarios y la antigüedad de la foto. Solo para pruebas.</span></span><input type="checkbox" [ngModel]="game.demoSpeed()" (ngModelChange)="setSetting('demoSpeed', $event)" /></label>
          @if (pwa.canInstall()) { <button (click)="pwa.install()"><ion-icon name="download" /><span>Instalar GritAI en este dispositivo</span><ion-icon name="chevron-forward" /></button> }
          <button (click)="exportData()"><ion-icon name="share-outline" /><span>Exportar mis datos (JSON)</span><ion-icon name="chevron-forward" /></button>
          @if (isDemo) { <button (click)="resetDemo()"><ion-icon name="refresh" /><span>Restablecer esta cuenta de demostración</span><ion-icon name="chevron-forward" /></button> }
        </div>

        <div class="card soft-blue small">
          <b><ion-icon name="cloud-offline" /> Funciona sin conexión</b>
          <p class="xs" style="margin-top:4px">Tus datos se guardan solo en este dispositivo (IndexedDB y localStorage). {{ pwa.online() ? 'Conexión disponible.' : 'Ahora estás sin conexión.' }} {{ storageText() }}</p>
        </div>

        <button class="btn danger block" (click)="logout()"><ion-icon name="log-out" /> Cerrar sesión</button>
        <p class="xs muted center">GritAI · basado en la metodología GRIT de Angela Duckworth</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .hero { padding-top: 26px; } .op { opacity: .9; font-weight: 700; } .nm { display: flex; align-items: center; gap: 8px; justify-content: center; margin-top: 6px; } h1 { font-size: 30px; }
    .nm .input { max-width: 200px; text-align: center; padding: 8px 12px; } .ed { border: 0; background: rgba(255,255,255,.22); color: #fff; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 18px; cursor: pointer; } .ed.ok { background: #fff; color: var(--g-purple); }
    .stat { background: #fff; border-radius: 22px; padding: 14px; box-shadow: var(--g-shadow-sm); display: flex; flex-direction: column; align-items: center; gap: 2px; ion-icon { font-size: 24px; } b { font-size: 28px; } span { font-size: 12px; color: var(--g-muted); font-weight: 700; } }
    h2.sec { font-size: 18px; } .list { padding: 6px; display: flex; flex-direction: column; }
    .list button, .opt { display: flex; align-items: center; gap: 12px; padding: 13px 12px; border: 0; background: none; font: inherit; font-weight: 700; color: var(--g-ink); text-align: left; cursor: pointer; border-radius: 16px; border-bottom: 1px solid #f3f0fc; &:last-child { border: 0; } ion-icon:first-child { font-size: 22px; color: var(--g-purple); } ion-icon:last-child { color: #b9b3dd; } &:active { background: #faf8ff; } }
    .list button span:first-of-type { flex: 1; } .opt input { width: 22px; height: 22px; accent-color: var(--g-purple); flex-shrink: 0; }
  `],
})
export class ProfilePage implements OnInit {
  game = inject(GameStore);
  auth = inject(AuthService);
  pwa = inject(PwaService);
  ai = inject(AiService);
  private nav = inject(NavController);
  private db = inject(DbService);
  private alerts = inject(AlertController);
  private moods = inject(MoodService);
  private chat = inject(ChatService);

  editing = signal(false);
  nameEdit = '';
  storageText = signal('');
  get isDemo(): boolean { return this.auth.isDemo(this.game.state()?.userId ?? ''); }

  ngOnInit(): void {
    void navigator.storage?.estimate?.().then((e) => {
      if (e.usage !== undefined) this.storageText.set(`Almacenamiento usado: ${(e.usage / 1024 / 1024).toFixed(1)} MB.`);
    });
  }

  go(url: string): void { void this.nav.navigateForward(url); }
  startEdit(): void { this.nameEdit = this.game.name(); this.editing.set(true); }
  saveName(): void {
    const n = this.nameEdit.trim();
    if (n) this.game.patch({ name: n });
    this.editing.set(false);
  }

  setSetting(k: 'sound' | 'demoSpeed' | 'ai', v: boolean): void {
    this.game.update((s) => { s.settings[k] = v; });
  }

  async exportData(): Promise<void> {
    const uid = this.game.state()!.userId;
    const payload = {
      app: 'GritAI', exportedAt: new Date().toISOString(), user: this.auth.user()?.email,
      state: this.game.state(), moods: await this.db.getAllByUser('moods', uid), chat: await this.db.getAllByUser('chat', uid),
      note: 'Las fotografías de evidencia permanecen guardadas en el dispositivo y no se incluyen en este archivo.',
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `gritai-${this.auth.user()?.displayName ?? 'datos'}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async resetDemo(): Promise<void> {
    const al = await this.alerts.create({
      header: 'Restablecer cuenta', message: 'Se borrará el progreso de esta cuenta de demostración y volverá a su estado inicial.',
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Restablecer', role: 'confirm', cssClass: 'danger' }],
    });
    await al.present();
    const { role } = await al.onDidDismiss();
    if (role !== 'confirm') return;
    await this.auth.resetDemo(this.game.state()!.userId);
    await this.moods.load();
    await this.chat.load();
  }

  async logout(): Promise<void> {
    this.auth.signOut();
    await this.nav.navigateRoot('/login');
  }
}
