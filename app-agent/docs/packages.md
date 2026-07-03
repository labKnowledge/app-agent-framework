# Packages

All libraries publish under the **`@gakwaya`** npm scope.

## Public API (install these)

| Package | npm | Role |
|---------|-----|------|
| `@gakwaya/app-agent` | [app-agent](https://www.npmjs.com/package/@gakwaya/app-agent) | **Recommended entry** — facade over core + registry + workflow + UI |
| `@gakwaya/integrations-react` | [integrations-react](https://www.npmjs.com/package/@gakwaya/integrations-react) | React `Provider`, hooks, panel |
| `@gakwaya/integrations-vue` | [integrations-vue](https://www.npmjs.com/package/@gakwaya/integrations-vue) | Vue provider + composable |
| `@gakwaya/integrations-svelte` | [integrations-svelte](https://www.npmjs.com/package/@gakwaya/integrations-svelte) | Svelte context + panel |
| `@gakwaya/ui` | [ui](https://www.npmjs.com/package/@gakwaya/ui) | Standalone agent panel (vanilla) |

## Infrastructure (transitive or advanced use)

| Package | Role |
|---------|------|
| `@gakwaya/entities` | Shared domain types — zero internal deps |
| `@gakwaya/semantic-registry` | Runtime entity registry |
| `@gakwaya/state-manager` | App state tracking and diffing |
| `@gakwaya/memory` | Working, episodic, semantic memory |
| `@gakwaya/llm` | LLM client, prompts, cost tracking |
| `@gakwaya/tools` | Tool registry and built-in actions |
| `@gakwaya/planner` | Task decomposition |
| `@gakwaya/workflow` | Workflow orchestration |
| `@gakwaya/multi-agent` | Specialized agent routing |
| `@gakwaya/learning` | Pattern learning and replay |
| `@gakwaya/core` | ReAct orchestrator |
| `@gakwaya/integrations-shared` | Shared context for framework integrations |

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
