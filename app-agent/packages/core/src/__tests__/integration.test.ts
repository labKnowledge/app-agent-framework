import { describe, it, expect } from 'vitest';
import { AppAgentCore } from '../agent';
import { InMemoryStorageAdapter } from '@gakwaya/app-agent-entities';

describe('core integration', () => {
  it('wires state-manager and memory with entities types', async () => {
    const agent = new AppAgentCore({
      baseURL: 'https://api.example.com/v1',
      model: 'test',
      getAppState: async () => ({
        currentView: 'test',
        user: { id: '1', role: 'user', isAuthenticated: true },
        context: {},
        timestamp: Date.now(),
      }),
      trackState: true,
      enableMemory: true,
      memoryConfig: {
        maxWorkingMemory: 10,
        maxEpisodicMemory: 10,
        maxSemanticMemory: 10,
        consolidation: {
          workingMemoryRetention: 1000,
          consolidationInterval: 1000,
          maxEpisodicMemories: 10,
          importanceThreshold: 0.5,
          enableCompression: false,
        },
        enablePersistence: true,
        storage: new InMemoryStorageAdapter(),
      },
      maxSteps: 0,
    });

    expect(agent.status).toBe('idle');
    expect(agent.getMemoryManager()).toBeDefined();
    agent.dispose();
    expect(agent.status).toBe('disposed');
  });
});
