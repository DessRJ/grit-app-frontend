import { Injectable } from '@angular/core';

const DB_NAME = 'gritai';
const DB_VERSION = 1;

/**
 * Capa mínima sobre IndexedDB (sin dependencias).
 * Stores:
 *  - users     (keyPath id)            cuentas locales
 *  - state     (keyPath userId)        estado de juego por usuario
 *  - moods     (autoIncrement id)      registros de ánimo   [index userId]
 *  - chat      (autoIncrement id)      mensajes del coach   [index userId]
 *  - evidence  (keyPath id)            fotos/archivos de retos [index userId]
 *  - kv        (keyPath key)           metadatos (semilla, versión)
 */
@Injectable({ providedIn: 'root' })
export class DbService {
  private dbPromise?: Promise<IDBDatabase>;

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          db.createObjectStore('users', { keyPath: 'id' });
          db.createObjectStore('state', { keyPath: 'userId' });
          db.createObjectStore('moods', { keyPath: 'id', autoIncrement: true }).createIndex('userId', 'userId');
          db.createObjectStore('chat', { keyPath: 'id', autoIncrement: true }).createIndex('userId', 'userId');
          db.createObjectStore('evidence', { keyPath: 'id' }).createIndex('userId', 'userId');
          db.createObjectStore('kv', { keyPath: 'key' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('IndexedDB bloqueada por otra pestaña'));
      });
    }
    return this.dbPromise;
  }

  private async run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
    return this.run<T | undefined>(store, 'readonly', (s) => s.get(key));
  }

  put<T>(store: string, value: T): Promise<IDBValidKey> {
    return this.run(store, 'readwrite', (s) => s.put(value));
  }

  delete(store: string, key: IDBValidKey): Promise<undefined> {
    return this.run(store, 'readwrite', (s) => s.delete(key));
  }

  getAll<T>(store: string): Promise<T[]> {
    return this.run<T[]>(store, 'readonly', (s) => s.getAll());
  }

  getAllByUser<T>(store: string, userId: string): Promise<T[]> {
    return this.run<T[]>(store, 'readonly', (s) => s.index('userId').getAll(IDBKeyRange.only(userId)));
  }

  async deleteAllByUser(store: string, userId: string): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const idx = tx.objectStore(store).index('userId');
      const cur = idx.openKeyCursor(IDBKeyRange.only(userId));
      cur.onsuccess = () => {
        const c = cur.result;
        if (c) {
          tx.objectStore(store).delete(c.primaryKey);
          c.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Inserta varios registros en una sola transacción */
  async putMany<T>(store: string, values: T[]): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const s = tx.objectStore(store);
      values.forEach((v) => s.put(v));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Solicita almacenamiento persistente para que el navegador no purgue los datos */
  async requestPersistence(): Promise<boolean> {
    try {
      return (await navigator.storage?.persist?.()) ?? false;
    } catch {
      return false;
    }
  }
}
