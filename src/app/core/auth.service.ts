import { Injectable, computed, inject, signal } from '@angular/core';
import { DbService } from './db.service';
import { HashAlgo, hasSubtle, hashPassword, randomSalt } from './crypto';
import { GameStore } from './game.store';
import { MoodEntry, UserAccount } from './models';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, masterMoods, masterUserState, newUserState } from './seed';
import { ls } from './util';

const SESSION_KEY = 'gritai.session';
export const ONBOARDING_KEY = 'gritai.onboarding.done';
const SEED_VERSION = 'seed-v1';

export interface SignInResult {
  ok: boolean;
  error?: string;
}

/**
 * Autenticación 100 % local (sin servidor): solo inicio de sesión.
 * No existe registro ni proveedores externos: las cuentas se siembran en IndexedDB.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private db = inject(DbService);
  private store = inject(GameStore);

  readonly user = signal<UserAccount | null>(null);
  readonly isLoggedIn = computed(() => !!this.user());
  readonly ready = signal(false);

  private attempts = 0;
  private lockedUntil = 0;

  /** Se ejecuta al arrancar la app */
  async init(): Promise<void> {
    try {
      await this.seedIfNeeded();
      void this.db.requestPersistence();
      const id = ls.get(SESSION_KEY);
      if (id) {
        const u = await this.db.get<UserAccount>('users', id);
        if (u) {
          await this.store.load(u.id);
          if (this.store.state()) this.user.set(u);
          else ls.del(SESSION_KEY);
        } else ls.del(SESSION_KEY);
      }
    } catch (e) {
      console.error('Error inicializando almacenamiento local', e);
    } finally {
      this.ready.set(true);
    }
  }

  get onboardingDone(): boolean {
    return ls.get(ONBOARDING_KEY) === '1';
  }

  markOnboardingDone(): void {
    ls.set(ONBOARDING_KEY, '1');
  }

  private async seedIfNeeded(): Promise<void> {
    const marker = await this.db.get<{ key: string; value: string }>('kv', 'seed');
    if (marker?.value === SEED_VERSION) return;
    for (const a of DEMO_ACCOUNTS) await this.seedAccount(a.id);
    await this.db.put('kv', { key: 'seed', value: SEED_VERSION });
  }

  private async seedAccount(id: string): Promise<void> {
    const a = DEMO_ACCOUNTS.find((x) => x.id === id);
    if (!a) return;
    const algo: HashAlgo = hasSubtle() ? 'pbkdf2' : 'sha256js';
    const existing = await this.db.get<UserAccount>('users', id);
    let acc = existing;
    if (!acc) {
      const salt = randomSalt();
      acc = {
        id: a.id,
        email: a.email,
        displayName: a.displayName,
        salt,
        algo,
        hash: await hashPassword(DEMO_PASSWORD, salt, algo),
        profileLabel: a.profileLabel,
      };
      await this.db.put('users', acc);
    }
    await this.db.delete('state', id);
    await this.db.deleteAllByUser('moods', id);
    await this.db.deleteAllByUser('chat', id);
    await this.db.deleteAllByUser('evidence', id);
    if (a.kind === 'master') {
      await this.db.put('state', masterUserState(id, a.displayName));
      await this.db.putMany<MoodEntry>('moods', masterMoods(id));
    } else {
      await this.db.put('state', newUserState(id, a.displayName));
    }
  }

  /** Restablece los datos de una cuenta demo a su estado inicial */
  async resetDemo(userId: string): Promise<void> {
    await this.seedAccount(userId);
    await this.store.load(userId);
  }

  isDemo(userId: string): boolean {
    return DEMO_ACCOUNTS.some((a) => a.id === userId);
  }

  async signIn(emailRaw: string, password: string): Promise<SignInResult> {
    const email = emailRaw.trim().toLowerCase();
    if (!email || !password) return { ok: false, error: 'Ingresa tu correo y contraseña.' };
    const now = Date.now();
    if (now < this.lockedUntil) {
      return { ok: false, error: `Demasiados intentos. Espera ${Math.ceil((this.lockedUntil - now) / 1000)} s.` };
    }
    const users = await this.db.getAll<UserAccount>('users');
    const u = users.find((x) => x.email === email);
    const algo: HashAlgo = u?.algo ?? 'pbkdf2';
    if (algo === 'pbkdf2' && !hasSubtle()) {
      return { ok: false, error: 'Este navegador no permite verificar la contraseña en conexión no segura. Abre la app en https o localhost.' };
    }
    const hash = u ? await hashPassword(password, u.salt, algo) : '';
    if (!u || hash !== u.hash) {
      this.attempts++;
      if (this.attempts >= 5) {
        this.lockedUntil = Date.now() + 30_000;
        this.attempts = 0;
      }
      return { ok: false, error: 'Correo o contraseña incorrectos.' };
    }
    this.attempts = 0;
    await this.store.load(u.id);
    if (!this.store.state()) await this.db.put('state', newUserState(u.id, u.displayName)), await this.store.load(u.id);
    this.user.set(u);
    ls.set(SESSION_KEY, u.id);
    return { ok: true };
  }

  signOut(): void {
    this.store.unload();
    this.user.set(null);
    ls.del(SESSION_KEY);
  }
}
