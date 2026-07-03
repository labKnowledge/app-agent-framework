# Packages

All App-Agent libraries publish under the **`@gakwaya`** npm scope with an **`app-agent-`** prefix (except the facade `@gakwaya/app-agent`).

## Public API (install these)

| Package | npm | Role |
|---------|-----|------|
| `@gakwaya/app-agent` | [app-agent](https://www.npmjs.com/package/@gakwaya/app-agent) | **Recommended entry** — facade over core + registry + workflow + UI |
| `@gakwaya/app-agent-react` | [app-agent-react](https://www.npmjs.com/package/@gakwaya/app-agent-react) | React `Provider`, hooks, panel |
| `@gakwaya/app-agent-vue` | [app-agent-vue](https://www.npmjs.com/package/@gakwaya/app-agent-vue) | Vue provider + composable |
| `@gakwaya/app-agent-svelte` | [app-agent-svelte](https://www.npmjs.com/package/@gakwaya/app-agent-svelte) | Svelte context + panel |
| `@gakwaya/app-agent-ui` | [app-agent-ui](https://www.npmjs.com/package/@gakwaya/app-agent-ui) | Standalone agent panel (vanilla) |

## Infrastructure (transitive or advanced use)

| Package | Role |
|---------|------|
| `@gakwaya/app-agent-entities` | Shared domain types — zero internal deps |
| `@gakwaya/app-agent-semantic-registry` | Runtime entity registry |
| `@gakwaya/app-agent-state-manager` | App state tracking and diffing |
| `@gakwaya/app-agent-memory` | Working, episodic, semantic memory |
| `@gakwaya/app-agent-llm` | LLM client, prompts, cost tracking |
| `@gakwaya/app-agent-tools` | Tool registry and built-in actions |
| `@gakwaya/app-agent-planner` | Task decomposition |
| `@gakwaya/app-agent-workflow` | Workflow orchestration |
| `@gakwaya/app-agent-multi-agent` | Specialized agent routing |
| `@gakwaya/app-agent-learning` | Pattern learning and replay |
| `@gakwaya/app-agent-core` | ReAct orchestrator |
| `@gakwaya/app-agent-integrations-shared` | Shared context for framework integrations |

## Layer diagram

```
entities  →  (nothing)

infrastructure  →  entities
  semantic-registry, state-manager, memory, llm, tools,
  planner, workflow, multi-agent, learning

core  →  entities + infrastructure

ui  →  entities + core types

app-agent (facade)  →  core + registry + workflow + ui

integrations-*  →  app-agent + ui + integrations-shared
```

Enforced by `pnpm arch:check`. See [Architecture](./architecture.md) and [ADRs](./adr/README.md).

## Migration from legacy names

As of **0.2.0**, internal modules use an `@gakwaya/app-agent-*` prefix. Legacy flat names are **deprecated** on npm (not unpublished).

| Legacy (deprecated) | New name |
|---------------------|----------|
| `@gakwaya/core` | `@gakwaya/app-agent-core` |
| `@gakwaya/entities` | `@gakwaya/app-agent-entities` |
| `@gakwaya/ui` | `@gakwaya/app-agent-ui` |
| `@gakwaya/integrations-react` | `@gakwaya/app-agent-react` |
| `@gakwaya/integrations-vue` | `@gakwaya/app-agent-vue` |
| `@gakwaya/integrations-svelte` | `@gakwaya/app-agent-svelte` |
| `@gakwaya/integrations-shared` | `@gakwaya/app-agent-integrations-shared` |
| `@gakwaya/semantic-registry` | `@gakwaya/app-agent-semantic-registry` |
| `@gakwaya/state-manager` | `@gakwaya/app-agent-state-manager` |
| `@gakwaya/memory` | `@gakwaya/app-agent-memory` |
| `@gakwaya/llm` | `@gakwaya/app-agent-llm` |
| `@gakwaya/tools` | `@gakwaya/app-agent-tools` |
| `@gakwaya/planner` | `@gakwaya/app-agent-planner` |
| `@gakwaya/workflow` | `@gakwaya/app-agent-workflow` |
| `@gakwaya/multi-agent` | `@gakwaya/app-agent-multi-agent` |
| `@gakwaya/learning` | `@gakwaya/app-agent-learning` |

See [ADR-0009](./adr/ADR-0009-prefixed-package-names.md).

## Monorepo layout

```
packages/
├── entities/
├── semantic-registry/
├── state-manager/
├── memory/
├── llm/
├── tools/
├── planner/
├── workflow/
├── multi-agent/
├── learning/
├── core/
├── ui/
├── app-agent/          ← public facade
└── integrations/
    ├── shared/
    ├── react/
    ├── vue/
    └── svelte/
```
