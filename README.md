# App-Agent Framework

Application intelligence for web apps — AI agents that understand **app state**, **entities**, and **workflows**, not just the current page.

**npm:** [`@gakwaya/app-agent`](https://www.npmjs.com/package/@gakwaya/app-agent) · **Status:** Alpha (`0.1.x`)

## Repository layout

| Path | Purpose |
|------|---------|
| [`app-agent/`](./app-agent/) | TypeScript monorepo — packages, examples, CI, published `@gakwaya/*` libraries |
| [`rnd/`](./rnd/) | Research archive — vision, competitive analysis, original 16-week plan |

## Quick start (consumers)

```bash
pnpm add @gakwaya/app-agent
```

```typescript
import { AppAgent } from '@gakwaya/app-agent';
```

See [Getting Started](./app-agent/docs/getting-started.md) for full setup (React, Vue, Svelte).

## Development

```bash
cd app-agent
pnpm install
pnpm validate
```

See [Contributing](./app-agent/CONTRIBUTING.md) and [Agent Guide](./app-agent/AGENTS.md).

## Documentation

| Doc | Description |
|-----|-------------|
| [Documentation index](./app-agent/docs/README.md) | Full docs hub |
| [Architecture](./app-agent/docs/architecture.md) | System design |
| [ADRs](./app-agent/docs/adr/README.md) | Architecture decision records |
| [Publishing](./app-agent/docs/publishing.md) | npm release process |
| [Progress](./app-agent/docs/project/progress.md) | Implementation status |

## License

MIT — see `@gakwaya/*` package licenses on npm.
