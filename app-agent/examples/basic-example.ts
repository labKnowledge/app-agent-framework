/**
 * Basic App-Agent Example
 *
 * Demonstrates the public facade with app state awareness
 */

import { AppAgent } from '@app-agent/app-agent';

async function getAppState() {
  return {
    currentView: 'shop',
    user: {
      id: 'user-123',
      role: 'customer',
      isAuthenticated: true,
      attributes: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    },
    context: {
      cartItems: [],
      wishlist: [],
      recentViews: ['laptop-123', 'phone-456'],
    },
    timestamp: Date.now(),
  };
}

const agent = new AppAgent({
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
  getAppState,
  maxSteps: 40,
  stepDelay: 400,
  trackState: true,
  enableMemory: true,

  onBeforeTask: async (a) => {
    console.log('Starting task:', a.task);
  },

  onAfterTask: async (_a, result) => {
    console.log('Task completed:', result.success);
    console.log('Steps taken:', result.steps);
    console.log('Result:', result.result);
  },

  onBeforeStep: async (_a, step) => {
    console.log(`Step ${step}:`);
  },

  onDispose: () => {
    console.log('Agent disposed');
  },
});

agent.on('statuschange', ({ status }) => {
  console.log('Status:', status);
});

agent.on('activity', ({ activity }) => {
  console.log('Activity:', activity);
});

async function main() {
  try {
    console.log('=== App-Agent Example ===\n');

    const result = await agent.execute(
      'Find the best laptop under $1000 and tell me about it',
    );

    console.log('\n=== Result ===');
    console.log('Success:', result.success);
    console.log('Steps:', result.steps);
    console.log('Result:', result.result);

    agent.dispose();
  } catch (error) {
    console.error('Fatal error:', error);
    agent.dispose();
    process.exit(1);
  }
}

main();
