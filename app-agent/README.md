# App-Agent

> Application Intelligence Framework — AI agents that understand your entire app

Published on npm as **`@gakwaya/app-agent`** ([package page](https://www.npmjs.com/package/@gakwaya/app-agent)).

## Install

```bash
pnpm add @gakwaya/app-agent
```

```typescript
import { AppAgent } from '@gakwaya/app-agent';

const agent = new AppAgent({
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
  getAppState: async () => ({
    currentView: 'shop',
    user: { id: '1', role: 'customer', isAuthenticated: true, attributes: {} },
    context: {},
    timestamp: Date.now(),
  }),
});

await agent.execute('Find the best laptop under $1000');
agent.dispose();
```

## Documentation

| | |
|---|---|
| **[Docs index](./docs/README.md)** | Full documentation hub |
| [Getting started](./docs/getting-started.md) | React, Vue, Svelte, vanilla |
| [Packages](./docs/packages.md) | All `@gakwaya/*` packages |
| [Architecture](./docs/architecture.md) | System design |
| [ADRs](./docs/adr/README.md) | Decision records |
| [Contributing](./CONTRIBUTING.md) | Development workflow |
| [Agent guide](./AGENTS.md) | For AI assistants & contributors |

## Monorepo development

```bash
pnpm install
pnpm validate   # typecheck + lint + build + test + arch + bundle
```

## Repository structure

```
app-agent/
├── packages/       # @gakwaya/* libraries
├── examples/       # vanilla, react, vue, svelte demos
├── docs/           # canonical documentation
├── scripts/        # build, bundle check, release helpers
└── e2e/            # Playwright smoke tests
```

Research and original roadmap: [`../rnd/`](../rnd/README.md)

## License

MIT

**Status:** Alpha `0.1.x`
