# ADR-0006: Framework Integration Packages

## Status

Accepted

## Decision Drivers

- Phase 3 roadmap requires React, Vue, and Svelte integrations
- Framework bindings must not bypass the public facade or import orchestration internals
- Shared lifecycle (mount panel, dispose agent, event bridge) should not be duplicated three times

## Considered Options

1. Single `@app-agent/integrations` package with optional peer deps for all frameworks
2. Per-framework packages plus `@app-agent/integrations-shared` for common context logic
3. Framework code only in demo apps without published packages

## Decision Outcome

**Chosen option**: Per-framework packages under `packages/integrations/` plus `@app-agent/integrations-shared`.

### Package Layout

```
packages/integrations/
├── shared/   @app-agent/integrations-shared
├── react/    @app-agent/integrations-react
├── vue/      @app-agent/integrations-vue
└── svelte/   @app-agent/integrations-svelte
```

### Layer Rules

| Package | May depend on |
|---------|----------------|
| `integrations-shared` | `@app-agent/app-agent`, `@app-agent/ui`, `@app-agent/entities` |
| `integrations-react` | shared, facade, ui, entities, `react` (peer) |
| `integrations-vue` | shared, facade, ui, entities, `vue` (peer) |
| `integrations-svelte` | shared, facade, ui, entities, `svelte` (peer) |

Integration packages **must not** import `@app-agent/core` or other infrastructure packages directly.

### Shared Contract

`createAgentContext(config, options)` in `integrations-shared`:

- Instantiates `AppAgent` from the public facade
- Optionally mounts `AppAgentPanel` from `@app-agent/ui`
- Bridges `statuschange`, `activity`, and `historychange` events to a subscribe/getState API
- Calls `dispose()` on panel and agent on teardown

### Framework Bindings

- **React**: `AppAgentProvider`, `useAppAgent()`, `AppAgentPanel` (bridge component)
- **Vue**: `AppAgentPlugin`, `useAppAgent()` composable, `AppAgentPanel` component
- **Svelte**: `createAppAgentStore()`, `setAppAgentContext()`, `AppAgentPanel` component

## Validation

- `dependency-cruiser` rules enforce integration layer boundaries
- Demo apps in `examples/` exercise each integration with Product entity and checkout workflow
