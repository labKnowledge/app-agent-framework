# ADR-0009: Prefixed npm Package Names

## Status

Accepted

## Decision Drivers

- npm scope `@gakwaya/*` listed 17 packages with generic names (`core`, `llm`, `tools`) that read as company-wide libraries, not App-Agent modules
- `@gakwaya/core` was especially confusing next to `@gakwaya/app-agent`
- Consumers and contributors could not quickly identify which packages belong to App-Agent on npmjs.com
- Internal modular monolith architecture (ADR-0001) should remain; only **published names** change

## Considered Options

1. Single npm package `@gakwaya/app-agent` with subpath exports (`/core`, `/react`, …)
2. Keep flat `@gakwaya/*` names, document facade-only usage
3. Rename all modules to `@gakwaya/app-agent-*` prefix; deprecate old names on npm

## Decision Outcome

**Chosen option**: Rename all modules except the facade to `@gakwaya/app-agent-*` prefixed names. Publish under new names; deprecate legacy `@gakwaya/*` packages (do not unpublish).

### Rename map

| Old name | New name |
| -------- | -------- |
| `@gakwaya/app-agent` | `@gakwaya/app-agent` *(unchanged)* |
| `@gakwaya/core` | `@gakwaya/app-agent-core` |
| `@gakwaya/entities` | `@gakwaya/app-agent-entities` |
| `@gakwaya/ui` | `@gakwaya/app-agent-ui` |
| `@gakwaya/semantic-registry` | `@gakwaya/app-agent-semantic-registry` |
| `@gakwaya/state-manager` | `@gakwaya/app-agent-state-manager` |
| `@gakwaya/memory` | `@gakwaya/app-agent-memory` |
| `@gakwaya/llm` | `@gakwaya/app-agent-llm` |
| `@gakwaya/tools` | `@gakwaya/app-agent-tools` |
| `@gakwaya/planner` | `@gakwaya/app-agent-planner` |
| `@gakwaya/workflow` | `@gakwaya/app-agent-workflow` |
| `@gakwaya/multi-agent` | `@gakwaya/app-agent-multi-agent` |
| `@gakwaya/learning` | `@gakwaya/app-agent-learning` |
| `@gakwaya/integrations-shared` | `@gakwaya/app-agent-integrations-shared` |
| `@gakwaya/integrations-react` | `@gakwaya/app-agent-react` |
| `@gakwaya/integrations-vue` | `@gakwaya/app-agent-vue` |
| `@gakwaya/integrations-svelte` | `@gakwaya/app-agent-svelte` |

### Positive Consequences

- npm search and dependency trees clearly group App-Agent modules
- Facade import path unchanged for primary consumers
- Monorepo folder layout and layer rules unchanged
- Per-package builds and Changesets workflow unchanged

### Negative Consequences

- Breaking change for early adopters importing old package names
- Two names coexist on npm until legacy packages are deprecated
- Mechanical rename across monorepo and migration docs required

## Validation

- `pnpm validate` passes after rename
- `pnpm pack:smoke` passes for `@gakwaya/app-agent`
- Legacy packages deprecated via `scripts/deprecate-legacy-packages.ts` after 0.2.0 publish

## Migration

See [Packages](../packages.md#migration-from-legacy-names).
