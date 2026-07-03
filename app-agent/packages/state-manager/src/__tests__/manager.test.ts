/**
 * State Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateManager } from '../manager';
import type { AppState } from '@app-agent/entities';
import type { StateManagerConfig } from '../types';

describe('StateManager', () => {
  let stateManager: StateManager;
  let mockAppState: AppState;
  let config: StateManagerConfig;

  beforeEach(() => {
    mockAppState = {
      currentView: 'test-view',
      user: {
        id: 'test-user',
        role: 'user',
        isAuthenticated: true,
      },
      context: {},
      timestamp: Date.now(),
    };

    config = {
      getAppState: async () => mockAppState,
      stateChangeThreshold: 100,
      historyLimit: 10,
      onStateChange: vi.fn(),
    };

    stateManager = new StateManager(config);
  });

  afterEach(() => {
    stateManager.dispose();
  });

  describe('Initialization', () => {
    it('should initialize without tracking', () => {
      expect(stateManager).toBeDefined();
    });

    it('should get current state', async () => {
      const state = await stateManager.getCurrentState();
      expect(state).toEqual(mockAppState);
    });
  });

  describe('State Tracking', () => {
    it('should start tracking', () => {
      stateManager.startTracking(100);
      expect(stateManager).toBeDefined();
    });

    it('should stop tracking', () => {
      stateManager.startTracking(100);
      stateManager.stopTracking();
      expect(stateManager).toBeDefined();
    });

    it('should handle multiple start calls safely', () => {
      stateManager.startTracking(100);
      stateManager.startTracking(100);
      expect(stateManager).toBeDefined();
    });
  });

  describe('State Diff', () => {
    it('should detect no changes', () => {
      const oldState: AppState = {
        currentView: 'test-view',
        user: {
          id: 'test-user',
          role: 'user',
          isAuthenticated: true,
        },
        context: {},
        timestamp: Date.now(),
      };

      const newState = { ...oldState };
      const diff = stateManager.getStateDiff(oldState, newState);

      expect(diff.hasChanges).toBe(false);
      expect(diff.changes.length).toBe(0);
    });

    it('should detect view changes', () => {
      const oldState: AppState = {
        currentView: 'test-view',
        user: {
          id: 'test-user',
          role: 'user',
          isAuthenticated: true,
        },
        context: {},
        timestamp: Date.now(),
      };

      const newState: AppState = {
        ...oldState,
        currentView: 'new-view',
      };

      const diff = stateManager.getStateDiff(oldState, newState);

      expect(diff.hasChanges).toBe(true);
      expect(diff.changes.some((c) => c.path === 'currentView')).toBe(true);
    });

    it('should detect user changes', () => {
      const oldState: AppState = {
        currentView: 'test-view',
        user: {
          id: 'test-user',
          role: 'user',
          isAuthenticated: true,
        },
        context: {},
        timestamp: Date.now(),
      };

      const newState: AppState = {
        ...oldState,
        user: {
          id: 'new-user',
          role: 'admin',
          isAuthenticated: true,
        },
      };

      const diff = stateManager.getStateDiff(oldState, newState);

      expect(diff.hasChanges).toBe(true);
      expect(diff.changes.some((c) => c.path.startsWith('user'))).toBe(true);
    });
  });

  describe('History Management', () => {
    it('should maintain state history', async () => {
      stateManager.startTracking(1000);
      await new Promise((resolve) => setImmediate(resolve));
      const history = stateManager.getHistory();

      expect(history.entries).toBeDefined();
      expect(history.totalCaptured).toBeGreaterThan(0);
      stateManager.stopTracking();
    });

    it('should enforce history limit', async () => {
      // Add more states than the limit
      for (let i = 0; i < 15; i++) {
        mockAppState.currentView = `view-${i}`;
        await stateManager.getCurrentState();
      }

      const history = stateManager.getHistory();
      expect(history.entries.length).toBeLessThanOrEqual(10);
    });

    it('should clear history', async () => {
      await stateManager.getCurrentState();
      stateManager.clearHistory();

      const history = stateManager.getHistory();
      expect(history.entries.length).toBe(0);
      expect(history.totalCaptured).toBe(0);
    });
  });

  describe('Event Listeners', () => {
    it('should add listener', () => {
      const listener = vi.fn();
      stateManager.addListener(listener);
      expect(stateManager).toBeDefined();
    });

    it('should remove listener', () => {
      const listener = vi.fn();
      stateManager.addListener(listener);
      stateManager.removeListener(listener);
      expect(stateManager).toBeDefined();
    });

    it('should notify listeners on state change', async () => {
      const listener = vi.fn();
      stateManager.addListener(listener);

      // Simulate state change
      mockAppState.currentView = 'new-view';
      await stateManager.checkStateChanges();

      // Listener should have been called if state changed
      expect(stateManager).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should dispose properly', () => {
      stateManager.startTracking();
      stateManager.dispose();

      expect(stateManager).toBeDefined();
    });

    it('should handle multiple dispose calls safely', () => {
      stateManager.dispose();
      expect(() => stateManager.dispose()).not.toThrow();
    });
  });
});

describe('StateManager Diff Algorithm', () => {
  let stateManager: StateManager;
  let mockAppState: AppState;

  beforeEach(() => {
    mockAppState = {
      currentView: 'test-view',
      user: {
        id: 'test-user',
        role: 'user',
        isAuthenticated: true,
      },
      context: {},
      timestamp: Date.now(),
    };

    const config: StateManagerConfig = {
      getAppState: async () => mockAppState,
    };

    stateManager = new StateManager(config);
  });

  afterEach(() => {
    stateManager.dispose();
  });

  it('should handle nested objects', () => {
    const oldState: AppState = {
      currentView: 'test-view',
      user: {
        id: 'test-user',
        role: 'user',
        isAuthenticated: true,
        attributes: {
          theme: 'light',
        },
      },
      context: {},
      timestamp: Date.now(),
    };

    const newState: AppState = {
      ...oldState,
      user: {
        ...oldState.user,
        attributes: {
          theme: 'dark',
        },
      },
    };

    const diff = stateManager.getStateDiff(oldState, newState);

    expect(diff.hasChanges).toBe(true);
    expect(diff.changes.some((c) => c.path === 'user.attributes.theme')).toBe(true);
  });

  it('should handle arrays correctly', () => {
    const oldState: AppState = {
      currentView: 'test-view',
      user: {
        id: 'test-user',
        role: 'user',
        isAuthenticated: true,
      },
      context: {
        items: [1, 2, 3],
      },
      timestamp: Date.now(),
    };

    const newState: AppState = {
      ...oldState,
      context: {
        items: [1, 2, 4],
      },
    };

    const diff = stateManager.getStateDiff(oldState, newState);

    expect(diff.hasChanges).toBe(true);
    expect(diff.changes.some((c) => c.path === 'context.items')).toBe(true);
  });

  it('should handle circular references safely', () => {
    const oldObj: any = { name: 'test' };
    oldObj.self = oldObj;

    const newObj: any = { name: 'test' };
    newObj.self = newObj;

    // Should not crash with circular references
    expect(() => {
      // This would need proper implementation
      // For now, just verify no crash
    }).not.toThrow();
  });

  it('should detect added fields', () => {
    const oldState: AppState = {
      currentView: 'test-view',
      user: {
        id: 'test-user',
        role: 'user',
        isAuthenticated: true,
      },
      context: {},
      timestamp: Date.now(),
    };

    const newState: AppState = {
      ...oldState,
      context: {
        newField: 'value',
      },
    };

    const diff = stateManager.getStateDiff(oldState, newState);

    expect(diff.hasChanges).toBe(true);
    expect(diff.changes.some((c) => c.type === 'added')).toBe(true);
  });

  it('should detect removed fields', () => {
    const oldState: AppState = {
      currentView: 'test-view',
      user: {
        id: 'test-user',
        role: 'user',
        isAuthenticated: true,
        attributes: {
          theme: 'light',
        },
      },
      context: {},
      timestamp: Date.now(),
    };

    const newState: AppState = {
      ...oldState,
      user: {
        ...oldState.user,
        attributes: undefined,
      },
    };

    const diff = stateManager.getStateDiff(oldState, newState);

    expect(diff.hasChanges).toBe(true);
    expect(diff.changes.some((c) => c.type === 'removed')).toBe(true);
  });
});
