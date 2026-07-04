/**
 * Remote storage adapter — syncs to a host app backend API.
 */

import type { StoragePort } from './storage';

export interface RemoteStorageAdapterOptions {
  /** Base URL for storage API, e.g. `/api/agent-storage` */
  baseUrl: string;
  /** Optional auth header value */
  authHeader?: string;
  /** Prefix for keys on the remote server */
  keyPrefix?: string;
  fetchFn?: typeof fetch;
}

export class RemoteStorageAdapter implements StoragePort {
  private readonly baseUrl: string;
  private readonly authHeader?: string;
  private readonly keyPrefix: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: RemoteStorageAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.authHeader = options.authHeader;
    this.keyPrefix = options.keyPrefix ?? '';
    this.fetchFn = options.fetchFn ?? fetch;
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.authHeader) {
      headers['Authorization'] = this.authHeader;
    }
    return headers;
  }

  private remoteKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get(key: string): Promise<string | null> {
    const response = await this.fetchFn(
      `${this.baseUrl}/${encodeURIComponent(this.remoteKey(key))}`,
      { method: 'GET', headers: this.headers() }
    );
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`RemoteStorageAdapter.get failed: ${response.status}`);
    }
    const body = (await response.json()) as { value?: string };
    return body.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const response = await this.fetchFn(
      `${this.baseUrl}/${encodeURIComponent(this.remoteKey(key))}`,
      {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify({ value }),
      }
    );
    if (!response.ok) {
      throw new Error(`RemoteStorageAdapter.set failed: ${response.status}`);
    }
  }

  async remove(key: string): Promise<void> {
    const response = await this.fetchFn(
      `${this.baseUrl}/${encodeURIComponent(this.remoteKey(key))}`,
      { method: 'DELETE', headers: this.headers() }
    );
    if (!response.ok && response.status !== 404) {
      throw new Error(`RemoteStorageAdapter.remove failed: ${response.status}`);
    }
  }
}
