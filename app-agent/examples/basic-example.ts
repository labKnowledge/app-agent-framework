/**
 * Basic App-Agent Example
 *
 * Demonstrates the core agent with app state awareness
 */

import { AppAgentCore } from '@app-agent/core';

// Mock application state
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

// Create agent
const agent = new AppAgentCore({
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,

  getAppState,

  maxSteps: 40,
  stepDelay: 400,

  // Lifecycle hooks
  onBeforeTask: async (agent) => {
    console.log('🚀 Starting task:', agent.task);
  },

  onAfterTask: async (agent, result) => {
    console.log('✅ Task completed:', result.success);
    console.log('📊 Steps taken:', result.steps);
    console.log('📝 Result:', result.result);
  },

  onBeforeStep: async (agent, step) => {
    console.log(`\n📍 Step ${step}:`);
  },

  onAfterStep: async (agent, history) => {
    const lastEvent = history[history.length - 1];
    console.log('  Last action:', lastEvent.type, lastEvent.data);
  },

  onDispose: (agent) => {
    console.log('🧹 Agent disposed');
  },
});

// Listen to events
agent.on('statuschange', ({ status }) => {
  console.log('📊 Status:', status);
});

agent.on('activity', ({ activity }) => {
  console.log('  ⚡', activity);
});

agent.on('historychange', ({ history }) => {
  console.log('📜 History size:', history.length);
});

// Execute a task
async function main() {
  try {
    console.log('=== App-Agent Example ===\n');

    const result = await agent.execute('Find the best laptop under $1000 and tell me about it');

    console.log('\n=== Result ===');
    console.log('Success:', result.success);
    console.log('Steps:', result.steps);
    console.log('Result:', result.result);

    if (result.error) {
      console.error('Error:', result.error.message);
    }

    console.log('\n=== History ===');
    result.history.forEach((event, i) => {
      console.log(`${i + 1}. [${event.type}]`, JSON.stringify(event.data).substring(0, 100));
    });

    // Clean up
    agent.dispose();
  } catch (error) {
    console.error('Fatal error:', error);
    agent.dispose();
    process.exit(1);
  }
}

// Run example
main();
