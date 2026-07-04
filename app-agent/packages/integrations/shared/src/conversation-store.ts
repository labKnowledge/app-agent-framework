/**
 * Cross-session conversation persistence via StoragePort.
 */

import { LocalStorageAdapter, type StoragePort } from '@gakwaya/app-agent-entities';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  taskId?: string;
  timestamp: number;
}

export interface SessionSnapshot {
  sessionKey: string;
  messages: ConversationMessage[];
  lastRoute?: string;
  updatedAt: number;
}

export interface ConversationStoreOptions {
  sessionKey: string;
  storage?: StoragePort;
  maxMessages?: number;
}

export class ConversationStore {
  private readonly storage: StoragePort;
  private readonly sessionKey: string;
  private readonly maxMessages: number;
  private readonly storageKey: string;
  private snapshot: SessionSnapshot;

  constructor(options: ConversationStoreOptions) {
    this.sessionKey = options.sessionKey;
    this.storage = options.storage ?? new LocalStorageAdapter();
    this.maxMessages = options.maxMessages ?? 200;
    this.storageKey = `app-agent:conversation:${options.sessionKey}`;
    this.snapshot = {
      sessionKey: options.sessionKey,
      messages: [],
      updatedAt: Date.now(),
    };
  }

  async load(): Promise<void> {
    const raw = await this.storage.get(this.storageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SessionSnapshot;
      if (parsed.sessionKey === this.sessionKey && Array.isArray(parsed.messages)) {
        this.snapshot = parsed;
      }
    } catch {
      // ignore corrupt storage
    }
  }

  getMessages(): ConversationMessage[] {
    return [...this.snapshot.messages];
  }

  async append(
    message: Omit<ConversationMessage, 'id' | 'timestamp'> &
      Partial<Pick<ConversationMessage, 'id' | 'timestamp'>>
  ): Promise<ConversationMessage> {
    const entry: ConversationMessage = {
      id: message.id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: message.role,
      content: message.content,
      taskId: message.taskId,
      timestamp: message.timestamp ?? Date.now(),
    };

    this.snapshot.messages.push(entry);
    if (this.snapshot.messages.length > this.maxMessages) {
      this.snapshot.messages = this.snapshot.messages.slice(-this.maxMessages);
    }
    this.snapshot.updatedAt = Date.now();
    await this.persist();
    return entry;
  }

  async setLastRoute(route: string): Promise<void> {
    this.snapshot.lastRoute = route;
    this.snapshot.updatedAt = Date.now();
    await this.persist();
  }

  private async persist(): Promise<void> {
    await this.storage.set(this.storageKey, JSON.stringify(this.snapshot));
  }
}
