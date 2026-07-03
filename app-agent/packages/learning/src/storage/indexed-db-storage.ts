import type { Pattern } from '../types';
import { InMemoryPatternStorage } from './memory-storage';

const DB_NAME = 'app-agent-learning';
const STORE_NAME = 'patterns';

export class IndexedDBPatternStorage {
  private fallback = new InMemoryPatternStorage();

  private get dbAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  async save(pattern: Pattern): Promise<void> {
    if (!this.dbAvailable) {
      return this.fallback.save(pattern);
    }

    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(pattern);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async get(id: string): Promise<Pattern | null> {
    if (!this.dbAvailable) {
      return this.fallback.get(id);
    }

    const db = await this.openDb();
    const result = await new Promise<Pattern | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve((request.result as Pattern | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  }

  async list(): Promise<Pattern[]> {
    if (!this.dbAvailable) {
      return this.fallback.list();
    }

    const db = await this.openDb();
    const result = await new Promise<Pattern[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as Pattern[]) ?? []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  }

  async delete(id: string): Promise<void> {
    if (!this.dbAvailable) {
      return this.fallback.delete(id);
    }

    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
