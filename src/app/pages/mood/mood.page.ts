import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, NavController } from '@ionic/angular';
import { containsCrisis } from '../../core/chat.service';
import { MoodEntry, MoodKey } from '../../core/models';
import { MOODS, MoodService } from '../../core/mood.service';
import { fmtDate, fmtTime } from '../../core/util';
import { HeaderComponent } from '../../shared/header.component';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-mood',
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, HeaderComponent, MascotComponent],
  template: `
    <app-header title="¿Cómo te sientes hoy?" subtitle="Tu diario emocional" />
    <ion-content class="page">
      <div class="wrap">
        @if (!selected()) {
          <div class="grid2 fade-up">
            @for (m of moods; track m.key) {
              <button class="mood" [style.--c]="m.color" (click)="pickMood(m.key)">
                <app-mascot [mood]="m.key" [size]="96" />
                <b>{{ m.label }}</b>
              </button>
            }
          </div>
        } @else {
          <section class="card fade-up journal">
            <div class="row">
              <app-mascot [mood]="selected()!" [size]="64" [animated]="true" />
              <div class="grow"><b>{{ label(selected()!) }}</b><p class="small muted">Gracias por compartirlo.</p></div>
              <button class="icon-btn" (click)="selected.set(null)" aria-label="Cambiar emoción"><ion-icon name="swap-horizontal" /></button>
            </div>
            <div class="field">
              <label for="note">¿Qué te hizo sentir así hoy?</label>
              <textarea id="note" class="textarea" rows="5" placeholder="Cuéntame un poco…" [(ngModel)]="note" maxlength="600"></textarea>
              <span class="hint">{{ note.length }}/600 · Solo se guarda en tu dispositivo.</span>
            </div>
            @if (risk()) {
              <div class="card soft-red">
                <b>No estás solo.</b>
                <p class="small" style="margin:4px 0 10px">Lo que escribes suena muy pesado. Hay personas listas para escucharte ahora mismo.</p>
                <button class="btn danger sm" (click)="nav.navigateForward('/support')">Ver líneas de ayuda</button>
              </div>
            }
            <button class="btn xl block" (click)="save()" [disabled]="saving()">Guardar registro</button>
          </section>
        }

        @if (saved()) {
          <div class="card soft-green pop row"><app-mascot mood="happy" [size]="54" /><div><b>¡Registro guardado!</b><p class="small">Cada registro te ayuda a entenderte mejor.</p></div></div>
        }
        @if (savedLow()) {
          <div class="card soft-purple fade-up">
            <b>Gracias por confiar en mí.</b>
            <p class="small" style="margin:4px 0 10px">Si hoy fue un día pesado, puedo acompañarte o puedes revisar los recursos de apoyo.</p>
            <div class="row"><button class="btn sm" (click)="nav.navigateForward('/tabs/chat')">Hablar con el coach</button><button class="btn ghost sm" (click)="nav.navigateForward('/support')">Apoyo emocional</button></div>
          </div>
        }

        <h2 class="sec">Historial emocional</h2>
        @if (!entries().length) {
          <div class="card flat center muted">Aún no tienes registros. Elige cómo te sientes para empezar.</div>
        }
        @for (g of grouped(); track g.day) {
          <div class="day"><small class="muted bold">{{ g.label }}</small>
            @for (e of g.items; track e.id) {
              <div class="card item" [style.--c]="color(e.mood)">
                <app-mascot [mood]="e.mood" [size]="46" />
                <div class="grow"><b>{{ label(e.mood) }}</b> <span class="xs muted">· {{ time(e.t) }}</span>
                  @if (e.note) { <p class="small">{{ e.note }}</p> }
                </div>
                <button class="icon-btn" style="width:34px;height:34px;font-size:18px" (click)="remove(e.id!)" aria-label="Eliminar registro"><ion-icon name="trash-outline" /></button>
              </div>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .mood { background: #fff; border: 2.5px solid transparent; border-radius: 26px; padding: 16px 8px 14px; display: flex; flex-direction: column; align-items: center; gap: 8px; font: inherit; cursor: pointer; box-shadow: var(--g-shadow-sm); transition: all .15s; &:active { transform: scale(.96); border-color: var(--c); } b { font-size: 17px; } }
    .journal { display: flex; flex-direction: column; gap: 14px; }
    h2.sec { font-size: 18px; margin-top: 8px; } .day { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
    .item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-left: 5px solid var(--c); }
  `],
})
export class MoodPage {
  private svc = inject(MoodService);
  nav = inject(NavController);
  moods = MOODS;
  selected = signal<MoodKey | null>(null);
  note = '';
  saved = signal(false);
  savedLow = signal(false);
  saving = signal(false);
  entries = this.svc.entries;
  risk(): boolean { return this.note.length > 3 && containsCrisis(this.note); }

  grouped = computed(() => {
    const map = new Map<string, MoodEntry[]>();
    for (const e of this.entries()) {
      const arr = map.get(e.day) ?? [];
      arr.push(e);
      map.set(e.day, arr);
    }
    return [...map.entries()].map(([day, items]) => ({ day, label: fmtDate(day, { weekday: 'long', day: 'numeric', month: 'long' }), items }));
  });

  label(k: MoodKey): string { return MOODS.find((m) => m.key === k)!.label; }
  color(k: MoodKey): string { return MOODS.find((m) => m.key === k)!.color; }
  time(t: number): string { return fmtTime(t); }

  pickMood(k: MoodKey): void {
    this.selected.set(k);
    this.saved.set(false);
    this.savedLow.set(false);
  }

  async save(): Promise<void> {
    const m = this.selected();
    if (!m) return;
    this.saving.set(true);
    await this.svc.add(m, this.note);
    this.saving.set(false);
    const crisis = containsCrisis(this.note);
    this.savedLow.set(crisis || m === 'sad' || m === 'overwhelmed');
    this.saved.set(!this.savedLow());
    this.selected.set(null);
    this.note = '';
  }

  async remove(id: number): Promise<void> {
    await this.svc.remove(id);
  }
}
