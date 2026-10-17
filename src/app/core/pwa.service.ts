import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Instalación de la PWA, estado de conexión y actualizaciones del service worker */
@Injectable({ providedIn: 'root' })
export class PwaService {
  private sw = inject(SwUpdate, { optional: true });
  readonly canInstall = signal(false);
  readonly installed = signal(window.matchMedia?.('(display-mode: standalone)').matches ?? false);
  readonly online = signal(navigator.onLine);
  readonly updateReady = signal(false);
  private deferred: BeforeInstallPromptEvent | null = null;

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.canInstall.set(false);
    });
    window.addEventListener('online', () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));
    this.sw?.versionUpdates.subscribe((e) => {
      if (e.type === 'VERSION_READY') this.updateReady.set(true);
    });
  }

  async install(): Promise<void> {
    if (!this.deferred) return;
    await this.deferred.prompt();
    await this.deferred.userChoice;
    this.deferred = null;
    this.canInstall.set(false);
  }

  reload(): void {
    void (this.sw?.isEnabled ? this.sw.activateUpdate() : Promise.resolve()).then(() => location.reload());
  }
}
