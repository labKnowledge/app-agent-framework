# Getting Started with App-Agent

## Install

```bash
pnpm add @gakwaya/app-agent
```

## Vanilla JavaScript / TypeScript

```typescript
import { AppAgent } from '@gakwaya/app-agent';

const agent = new AppAgent({
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
  getAppState: async () => ({
    currentView: 'shop',
    user: { id: '1', role: 'customer', isAuthenticated: true },
    context: { cartItems: [] },
    timestamp: Date.now(),
  }),
  entities: { Product: productSchema },
  workflows: { checkout: checkoutWorkflow },
  enableToolCaching: true,
  trackState: true,
});

await agent.execute('Find the best laptop under $1000');
agent.dispose();
```

See [examples/vanilla-demo](../examples/vanilla-demo/).

## React

```bash
pnpm add @gakwaya/app-agent-react react
```

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

See [examples/react-demo](../examples/react-demo/).

## Vue

```bash
pnpm add @gakwaya/app-agent-vue vue
```

```vue
<AppAgentProvider :config="agentConfig">
  <Shop />
</AppAgentProvider>
```

```typescript
import { AppAgentProvider, useAppAgent, AppAgentPanel } from '@gakwaya/app-agent-vue';
```

See [examples/vue-demo](../examples/vue-demo/).

## Svelte

```bash
pnpm add @gakwaya/app-agent-svelte svelte
```

```svelte
<script>
  import { setAppAgentContext } from '@gakwaya/app-agent-svelte';
  import AppAgentPanel from '@gakwaya/app-agent-svelte/AppAgentPanel.svelte';

  const agent = setAppAgentContext(agentConfig);
</script>

<AppAgentPanel />
```

See [examples/svelte-demo](../examples/svelte-demo/).

## Validation

```bash
pnpm validate   # typecheck + lint + test + arch:check + bundle:check
pnpm test:coverage
```

## Further Reading

- [Documentation index](./README.md)
- [Architecture](./architecture.md)
- [ADR index](./adr/README.md)
- [Packages](./packages.md)
- Research archive: [rnd/](../../rnd/)
