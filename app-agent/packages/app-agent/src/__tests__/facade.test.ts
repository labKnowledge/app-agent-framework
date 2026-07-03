import { describe, it, expect } from 'vitest';
import { AppAgent } from '../app-agent';

describe('@app-agent/app-agent facade', () => {
  it('maps entities and workflows config to core', () => {
    const agent = new AppAgent({
      baseURL: 'https://api.example.com/v1',
      model: 'test-model',
      getAppState: async () => ({
        currentView: 'home',
        user: { id: '1', role: 'user', isAuthenticated: true },
        context: {},
        timestamp: Date.now(),
      }),
      entities: {
        Product: {
          type: 'Product',
          name: 'Product',
          description: 'A product',
          properties: [],
          relationships: [],
          metadata: { category: 'commerce', tags: [] },
        },
      },
      workflows: {
        checkout: {
          name: 'checkout',
          steps: ['review-cart', 'payment'],
        },
      },
    });

    expect(agent.getSemanticRegistry().getAllSchemas()).toHaveLength(1);
    expect(agent.getWorkflowEngine().getWorkflow('checkout')).toBeDefined();
    agent.dispose();
  });
});
