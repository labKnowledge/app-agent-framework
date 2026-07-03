import { describe, it, expect, vi, afterEach } from 'vitest';
import { createAgentContext } from '../index';

describe('createAgentContext', () => {
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
    vi.restoreAllMocks();
  });

  it('creates agent context without mounting panel in node', () => {
    const ctx = createAgentContext(config, { mountPanel: false });

    expect(ctx.agent).toBeDefined();
    expect(ctx.panel).toBeNull();
    expect(ctx.getState().status).toBe('idle');

    ctx.dispose();
  });

  it('notifies subscribers on status change', () => {
    const ctx = createAgentContext(config, { mountPanel: false });
    const listener = vi.fn();

    ctx.subscribe(listener);
    ctx.agent.emit('statuschange', { type: 'statuschange', status: 'running' });

    expect(listener).toHaveBeenCalled();
    expect(ctx.getState().status).toBe('running');

    ctx.dispose();
  });
});
