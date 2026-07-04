import { describe, it, expect, afterEach } from 'vitest';
import { acquireSession, releaseSession, resetAllSessions } from '../session';
import { createAgentContext } from '../index';

describe('AgentSessionManager', () => {
  const config = {
    baseURL: 'https://api.example.com',
    model: 'test',
    getAppState: async () => ({
      currentView: 'shop',
      user: { id: '1', role: 'user', isAuthenticated: true },
      context: {},
      timestamp: Date.now(),
    }),
  };

  afterEach(() => {
    resetAllSessions();
  });

  it('reuses session on second acquire', () => {
    const first = acquireSession('test', () => createAgentContext(config, { mountPanel: false }));
    const second = acquireSession('test', () => createAgentContext(config, { mountPanel: false }));

    expect(first).toBe(second);
    expect(first.agent.status).not.toBe('disposed');

    releaseSession('test');
    releaseSession('test');
  });

  it('survives StrictMode-style unmount/remount before dispose microtask', async () => {
    const key = 'strict';
    const ctx1 = acquireSession(key, () => createAgentContext(config, { mountPanel: false }));
    releaseSession(key);

    const ctx2 = acquireSession(key, () => createAgentContext(config, { mountPanel: false }));

    expect(ctx2.agent.status).not.toBe('disposed');
    expect(ctx1).toBe(ctx2);

    releaseSession(key);
    await new Promise((resolve) => queueMicrotask(resolve));
  });

  it('keeps session alive when persistSession is true', async () => {
    acquireSession(
      'persist',
      () => createAgentContext(config, { mountPanel: false, persistSession: true }),
      { persistSession: true }
    );
    releaseSession('persist');
    await new Promise((resolve) => queueMicrotask(resolve));

    const ctx = acquireSession(
      'persist',
      () => createAgentContext(config, { mountPanel: false, persistSession: true }),
      { persistSession: true }
    );
    expect(ctx.agent.status).not.toBe('disposed');

    resetAllSessions();
  });
});
