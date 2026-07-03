# @gakwaya/app-agent

Application intelligence for web apps — an AI agent that understands your **app state**, **entities**, and **workflows**, not just the current page.

**Status:** Alpha (`0.1.x`) — API may change.

## Install

```bash
pnpm add @gakwaya/app-agent
# or
npm install @gakwaya/app-agent
```

### React (optional)

```bash
pnpm add @gakwaya/app-agent-react @gakwaya/app-agent-ui
```

## Quick start

```typescript
import { AppAgent } from '@gakwaya/app-agent';
import type { AppState, EntitySchema, WorkflowDefinition } from '@gakwaya/app-agent';

const productEntity: EntitySchema = {
  type: 'Product',
  name: 'Product',
  description: 'E-commerce product',
  properties: [
    { name: 'id', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'price', type: 'number', required: true },
  ],
  operations: [],
};

const agent = new AppAgent({
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
  getAppState: async (): Promise<AppState> => ({
    currentView: 'shop',
    user: {
      id: 'user-1',
      role: 'customer',
      isAuthenticated: true,
      attributes: {},
    },
    context: { products: [] },
    timestamp: Date.now(),
  }),
  entities: { Product: productEntity },
  enableToolCaching: true,
  trackState: true,
});

const result = await agent.execute('Find the best laptop under $1000');
console.log(result.success, result.message);

agent.dispose();
```

## Configuration

| Option | Required | Description |
|--------|----------|-------------|
| `baseURL` | Yes | OpenAI-compatible API base URL |
| `model` | Yes | Model name (e.g. `gpt-4`) |
| `getAppState` | Yes | Returns current app state for the agent |
| `apiKey` | No | LLM API key (or set via env on your server) |
| `entities` | No | Domain entity schemas (`Product`, `Order`, …) |
| `workflows` | No | Multi-step workflow definitions |
| `enableMemory` | No | Persist context across tasks |
| `enableMultiAgent` | No | Route tasks to specialized agents |
| `enableLearning` | No | Replay patterns from successful runs |
| `maxSteps` | No | ReAct loop step limit (default: 20) |

## React integration

```tsx
import { AppAgentProvider, useAppAgent, AppAgentPanel } from '@gakwaya/app-agent-react';

function Shop() {
  const { execute } = useAppAgent();
  return (
    <>
      <button onClick={() => execute('Find laptops under $1000')}>Ask agent</button>
      <AppAgentPanel />
    </>
  );
}

export function App() {
  return (
    <AppAgentProvider config={agentConfig}>
      <Shop />
    </AppAgentProvider>
  );
}
```

## Related packages

| Package | Purpose |
|---------|---------|
| `@gakwaya/app-agent-react` | React provider + hooks + panel |
| `@gakwaya/app-agent-vue` | Vue composables + provider |
| `@gakwaya/app-agent-svelte` | Svelte context + panel |
| `@gakwaya/app-agent-ui` | Standalone agent panel UI |
| `@gakwaya/app-agent-core` | Core ReAct orchestrator (advanced) |

## Links

- [Repository](https://github.com/labKnowledge/app-agent-framework)
- [Issues](https://github.com/labKnowledge/app-agent-framework/issues)

## License

MIT
