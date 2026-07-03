# Getting Started

## Install

```bash
pnpm install
```

## Basic Usage

```typescript
import { AppAgent } from '@app-agent/app-agent';

const agent = new AppAgent({
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
  getAppState: async () => ({
    currentView: 'shop',
    user: { id: '1', role: 'user', isAuthenticated: true },
    context: {},
    timestamp: Date.now(),
  }),
});

await agent.execute('Help me find a product');
```

See [examples/basic-example.ts](../examples/basic-example.ts) for a full example.
