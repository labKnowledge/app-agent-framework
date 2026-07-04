/**
 * Module-scoped agent session with ref-counting for StrictMode-safe lifecycle.
 */

import type { AgentContext } from './context-types';

export interface SessionOptions {
  persistSession?: boolean;
}

interface SessionEntry {
  context: AgentContext;
  refCount: number;
  persistSession: boolean;
  disposeScheduled: boolean;
}

const sessions = new Map<string, SessionEntry>();

function cancelPendingDispose(entry: SessionEntry): void {
  entry.disposeScheduled = false;
}

function scheduleDispose(key: string, entry: SessionEntry): void {
  if (entry.persistSession || entry.disposeScheduled) {
    return;
  }
  entry.disposeScheduled = true;
  queueMicrotask(() => {
    const current = sessions.get(key);
    if (!current || current !== entry) {
      return;
    }
    if (current.refCount > 0) {
      current.disposeScheduled = false;
      return;
    }
    current.context.dispose();
    sessions.delete(key);
  });
}

/**
 * Acquire a session by key. Creates on first acquire; recreates if disposed.
 */
export function acquireSession(
  key: string,
  factory: () => AgentContext,
  options: SessionOptions = {}
): AgentContext {
  const persistSession = options.persistSession ?? false;
  let entry = sessions.get(key);

  if (!entry || entry.context.agent.status === 'disposed') {
    if (entry) {
      sessions.delete(key);
    }
    entry = {
      context: factory(),
      refCount: 0,
      persistSession,
      disposeScheduled: false,
    };
    sessions.set(key, entry);
  } else {
    entry.persistSession = persistSession || entry.persistSession;
    if (entry.disposeScheduled) {
      cancelPendingDispose(entry);
    }
  }

  entry.refCount += 1;
  return entry.context;
}

/**
 * Release a session reference. Disposes when ref count reaches zero (unless persistSession).
 */
export function releaseSession(key: string): void {
  const entry = sessions.get(key);
  if (!entry) {
    return;
  }

  entry.refCount = Math.max(0, entry.refCount - 1);

  if (entry.refCount === 0 && !entry.persistSession) {
    scheduleDispose(key, entry);
  }
}

/** Get session without acquiring (returns null if missing or disposed). */
export function getSession(key: string): AgentContext | null {
  const entry = sessions.get(key);
  if (!entry || entry.context.agent.status === 'disposed') {
    return null;
  }
  return entry.context;
}

/** Reset all sessions — for tests only. */
export function resetAllSessions(): void {
  for (const [key, entry] of sessions) {
    if (entry.context.agent.status !== 'disposed') {
      entry.context.dispose();
    }
    sessions.delete(key);
  }
}
