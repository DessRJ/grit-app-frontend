import { Injectable, computed, inject, signal } from '@angular/core';
import { DbService } from './db.service';
import { GameStore } from './game.store';
import { MoodEntry, MoodKey } from './models';
import { dayStr } from './util';

export const MOODS: { key: MoodKey; label: string; color: string; value: number }[] = [
  { key: 'happy', label: 'Muy bien', color: '#16a34a', value: 4 },
  { key: 'normal', label: 'Normal', color: '#2563eb', value: 3 },
  { key: 'sad', label: 'Triste', color: '#7c3aed', value: 2 },
  { key: 'overwhelmed', label: 'Abrumado', color: '#ea580c', value: 1 },
];

@Injectable({ providedIn: 'root' })
export class MoodService {
  private db = inject(DbService);
  private game = inject(GameStore);

  readonly entries = signal<MoodEntry[]>([]);
  readonly latest = computed(() => this.entries()[0] ?? null);

  async load(): Promise<void> {
    const uid = this.game.state()?.userId;
    if (!uid) {
      this.entries.set([]);
      return;
    }
    const list = await this.db.getAllByUser<MoodEntry>('moods', uid);
    list.sort((a, b) => b.t - a.t);
    this.entries.set(list);
    this.game.moodCount.set(list.length);
  }

  async add(mood: MoodKey, note: string): Promise<void> {
    const uid = this.game.state()?.userId;
    if (!uid) return;
    const t = Date.now();
    const entry: MoodEntry = { userId: uid, mood, note: note.trim(), t, day: dayStr(t) };
    const id = (await this.db.put('moods', entry)) as number;
    this.entries.update((l) => [{ ...entry, id }, ...l]);
    this.game.moodCount.set(this.entries().length);
    this.game.markActivity();
  }

  async remove(id: number): Promise<void> {
    await this.db.delete('moods', id);
    this.entries.update((l) => l.filter((e) => e.id !== id));
    this.game.moodCount.set(this.entries().length);
  }

  hasToday(): boolean {
    const d = dayStr();
    return this.entries().some((e) => e.day === d);
  }
}
