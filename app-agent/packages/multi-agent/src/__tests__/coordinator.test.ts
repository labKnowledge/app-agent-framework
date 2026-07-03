import { describe, it, expect } from 'vitest';
import {
  MultiAgentCoordinator,
  NavigationAgent,
  CommerceAgent,
  createBuiltInAgents,
} from '../coordinator';
import type { AgentContext } from '../types';

const mockContext: AgentContext = {
  appState: {
    currentView: 'shop',
    user: { id: '1', role: 'user', isAuthenticated: true },
    context: {},
    timestamp: Date.now(),
  },
  sharedContext: new Map(),
};

describe('MultiAgentCoordinator', () => {
  it('routes commerce tasks to commerce agent', () => {
    const coordinator = new MultiAgentCoordinator();
    for (const agent of createBuiltInAgents({ execute: async () => ({ success: true, result: 'ok', steps: 1, history: [] }) })) {
      coordinator.registerAgent(agent);
    }

    const route = coordinator.selectAgent('Add laptop to cart and checkout');
    expect(route?.agent.name).toBe('commerce');
    expect(route?.score).toBeGreaterThan(0);
  });

  it('routes navigation tasks to navigation agent', () => {
    const coordinator = new MultiAgentCoordinator();
    coordinator.registerAgent(new NavigationAgent({ execute: async () => ({ success: true, result: 'ok', steps: 1, history: [] }) }));

    const route = coordinator.selectAgent('Navigate to settings page');
    expect(route?.agent.name).toBe('navigation');
  });

  it('delegates execution to selected agent', async () => {
    const coordinator = new MultiAgentCoordinator();
    const executed: string[] = [];
    coordinator.registerAgent(
      new CommerceAgent({
        execute: async (task) => {
          executed.push(task);
          return { success: true, result: 'done', steps: 1, history: [] };
        },
      })
    );

    await coordinator.delegate('commerce', 'buy mouse', mockContext);
    expect(executed[0]).toContain('[Commerce specialist]');
  });
});
