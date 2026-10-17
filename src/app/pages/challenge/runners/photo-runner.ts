import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular';
import { Challenge } from '../../../core/challenges.data';
import { AiService } from '../../../core/ai.service';
import { EvidenceService, compressImage } from '../../../core/evidence.service';
import { GameStore } from '../../../core/game.store';
import { fmtClock, fmtDate } from '../../../core/util';
import { RunnerResult } from './runner';

const CODE_TTL = 10 * 60 * 1000;

interface Shot { evidenceId: string; url: string; label: string; code?: string; ai?: 'ok' | 'unsure' | 'off'; aiNote?: string }

@Component({
  selector: 'app-run-photo',
  standalone: true,
  imports: [FormsModule, IonIcon],
  template: `
    @if (v(); as v) {
      <section class="card col">
        <b>{{ v.hint }}</b>
        @if (v.shots.length > 1) {
          <div class="row">@for (s of v.shots; track s; let i = $index) { <span class="chip" [class.green]="i < shots().length" [class.gray]="i > shots().length">{{ i + 1 }}. {{ s }}</span> }</div>
        }
      </section>

      @for (s of shots(); track s.evidenceId) {
        <div class="card row"><img [src]="s.url" [alt]="s.label" class="thumb" /><div class="grow"><b>{{ s.label }}</b><p class="xs muted">{{ s.code ? 'Código ' + s.code : 'Archivo adjuntado' }} · guardada en tu dispositivo</p>
          @if (s.ai === 'ok') { <p class="xs ok-t"><ion-icon name="sparkles" /> Revisada por IA: correcta</p> }
          @else if (s.ai === 'unsure') { <p class="xs muted"><ion-icon name="sparkles" /> IA: no concluyente{{ s.aiNote ? ' · ' + s.aiNote : '' }}. Se acepta.</p> }
          @else { <p class="xs muted">Sin revisión de IA (offline o desactivada)</p> }</div><ion-icon name="checkmark-circle" class="ok" /></div>
      }

      @if (shots().length < v.shots.length) {
        @if (needsCode() && !activeCode()) {
          <section class="card soft-purple col">
            <p class="small">Al iniciar se genera un <b>código de 4 dígitos</b> que debes escribir a mano en un papel junto con la fecha de hoy. Tienes <b>10 minutos</b> para tomar la foto.</p>
            <button class="btn xl block" (click)="issue()"><ion-icon name="key" /> Iniciar reto ({{ currentLabel() }})</button>
          </section>
        } @else {
          @if (needsCode() && activeCode()) {
            <section class="card grad grad-brand center">
              <small class="op">ESCRIBE EN UN PAPEL</small>
              <p class="paper">{{ today }}</p>
              <div class="code">{{ activeCode() }}</div>
              <span class="chip white"><ion-icon name="time-outline" />Caduca en {{ left() }}</span>
            </section>
          }
          @if (!expired()) {
            <section class="card col">
              <label class="btn xl block pick" [class.dis]="busy()">
                <ion-icon [name]="needsCode() ? 'camera' : 'document-attach'" /> {{ busy() ? 'Revisando…' : needsCode() ? 'Tomar foto: ' + currentLabel() : 'Adjuntar: ' + currentLabel() }}
                <input type="file" [attr.accept]="accept()" [attr.capture]="v.source === 'any' || v.code === false ? null : 'environment'" (change)="onFile($event)" [disabled]="busy()" hidden />
              </label>
              <p class="xs muted center">{{ needsCode() ? 'En el celular se abre la cámara. No se admiten fotos de la galería.' : 'Puedes elegir una captura, imagen o PDF.' }}</p>
            </section>
          } @else {
            <section class="card soft-red col"><b>El código caducó</b><p class="small">Genera uno nuevo para continuar.</p><button class="btn" (click)="issue()">Generar nuevo código</button></section>
          }
        }
        @if (v.allowLink && !shots().length) {
          <section class="card col">
            <b class="small">…o comparte un enlace público</b>
            <input class="input" type="url" inputmode="url" placeholder="https://…" [(ngModel)]="link" />
            <button class="btn ghost" [disabled]="!validLink()" (click)="finishLink()">Usar enlace como evidencia</button>
          </section>
        }
        @if (error()) { <p class="hint err" role="alert">{{ error() }}</p> }
      }

      @if (shots().length === v.shots.length) {
        @if (v.deadline) {
          <section class="card col">
            <div class="field"><label for="dl">Fecha y hora límite oficial de entrega</label>
              <input id="dl" class="input" type="datetime-local" [(ngModel)]="deadline" /></div>
            <span class="hint" [class.ok]="deadlineOk()" [class.err]="deadline && !deadlineOk()">{{ deadline ? (deadlineOk() ? 'Entregado con más de 24 h de anticipación.' : 'La fecha límite debe ser al menos 24 h posterior a hoy.') : 'Indica la fecha límite para validar la anticipación.' }}</span>
          </section>
        }
        <button class="btn green xl block" [disabled]="!!v.deadline && !deadlineOk()" (click)="finish()">Enviar reto</button>
      }
    }
  `,
  styles: [`
    .thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 14px; background: #eee; } .ok { color: var(--g-green); font-size: 26px; }
    .paper { font-size: 22px; font-weight: 900; margin: 4px 0; } .code { font-size: 64px; font-weight: 900; letter-spacing: 12px; padding-left: 12px; margin: 2px 0 8px; font-variant-numeric: tabular-nums; }
    .ok-t { color: var(--g-green); font-weight: 800; }
    .op { opacity: .9; font-weight: 800; letter-spacing: 1.4px; font-size: 11px; } .pick { cursor: pointer; } .pick.dis { opacity: .6; }
  `],
})
export class PhotoChallengeRunner implements OnInit, OnDestroy {
  private game = inject(GameStore);
  private evidence = inject(EvidenceService);
  private ai = inject(AiService);
  @Input({ required: true }) ch!: Challenge;
  @Output() complete = new EventEmitter<RunnerResult>();

  shots = signal<Shot[]>([]);
  busy = signal(false);
  error = signal('');
  link = '';
  deadline = '';
  today = fmtDate(Date.now(), { day: '2-digit', month: '2-digit', year: 'numeric' });
  private now = signal(Date.now());
  private timer?: ReturnType<typeof setInterval>;

  v = computed(() => (this.ch.v.t === 'photo' ? this.ch.v : null));
  needsCode = computed(() => this.v()?.code !== false);
  currentLabel = computed(() => this.v()?.shots[this.shots().length] ?? '');
  activeCode = computed(() => this.game.pendingOf(this.ch.id).code ?? '');
  issuedAt = computed(() => this.game.pendingOf(this.ch.id).codeIssuedAt ?? 0);
  expired = computed(() => this.needsCode() && !!this.activeCode() && this.now() - this.issuedAt() > CODE_TTL);
  left = computed(() => fmtClock((this.issuedAt() + CODE_TTL - this.now()) / 1000));
  accept = computed(() => (this.v()?.source === 'any' ? 'image/*,application/pdf' : 'image/*'));
  deadlineOk = computed(() => !!this.deadline && new Date(this.deadline).getTime() - Date.now() >= 24 * 3600 * 1000);

  ngOnInit(): void {
    this.timer = setInterval(() => this.now.set(Date.now()), 1000);
    // un código ya vencido de una sesión anterior se descarta
    if (this.activeCode() && Date.now() - this.issuedAt() > CODE_TTL) this.game.setPending(this.ch.id, { code: undefined, codeIssuedAt: undefined });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    this.shots().forEach((s) => URL.revokeObjectURL(s.url));
  }

  issue(): void {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    this.error.set('');
    this.now.set(Date.now());
    this.game.setPending(this.ch.id, { code, codeIssuedAt: Date.now() });
  }

  async onFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.error.set('');
    const demo = this.game.demoSpeed();
    if (this.needsCode()) {
      if (!this.activeCode() || Date.now() - this.issuedAt() > CODE_TTL) {
        this.error.set('El código caducó (10 min). Genera uno nuevo.');
        return;
      }
      if (!file.type.startsWith('image/')) { this.error.set('Debe ser una fotografía.'); return; }
      // anti-fraude: la imagen debe haberse creado después de generar el código
      if (!demo && file.lastModified && file.lastModified < this.issuedAt() - 15000) {
        this.error.set('Esta foto no es reciente. Debe tomarse en tiempo real con la cámara después de iniciar el reto.');
        return;
      }
    } else if (file.size > 8 * 1024 * 1024) {
      this.error.set('El archivo supera los 8 MB.');
      return;
    }
    this.busy.set(true);
    try {
      const uid = this.game.state()!.userId;
      const label = this.currentLabel();
      const code = this.needsCode() ? this.activeCode() : undefined;
      const id = await this.evidence.save(uid, this.ch.id, file, file.name || label, { code });
      const rec = await this.evidence.get(id);
      // La IA solo ayuda: rechaza únicamente cuando la foto es claramente incorrecta
      let aiState: Shot['ai'] = 'off';
      let aiNote = '';
      if (this.ai.active && file.type.startsWith('image/')) {
        const small = await compressImage(new File([rec!.blob], 'x.jpg', { type: rec!.blob.type }), 768, 0.7);
        const chk = await this.ai.checkPhoto(small, { label, code, date: this.today });
        if (chk?.verdict === 'fail') {
          await this.evidence.remove(id);
          this.error.set(`La IA no encontró lo que se pide: ${chk.reason || 'revisa la foto'}. Vuelve a tomarla.`);
          return;
        }
        if (chk) { aiState = chk.verdict === 'ok' ? 'ok' : 'unsure'; aiNote = chk.reason; }
      }
      this.shots.update((l) => [...l, { evidenceId: id, url: URL.createObjectURL(rec!.blob), label, code, ai: aiState, aiNote }]);
      this.game.setPending(this.ch.id, { code: undefined, codeIssuedAt: undefined });
    } catch {
      this.error.set('No se pudo guardar la imagen en el dispositivo. Libera espacio e inténtalo de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }

  validLink(): boolean {
    return /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(this.link.trim());
  }

  finishLink(): void {
    this.complete.emit({ data: { link: this.link.trim() } });
  }

  finish(): void {
    this.complete.emit({
      data: { codes: this.shots().map((s) => s.code ?? null), ai: this.shots().map((s) => s.ai ?? 'off'), capturedAt: Date.now(), deadline: this.deadline || undefined },
      evidenceIds: this.shots().map((s) => s.evidenceId),
    });
  }
}
