# App-Agent — Agent Guide

Application Intelligence Framework monorepo. AI agents that understand entire web applications.

## Package Map

| Package                        | Layer          | Purpose                                   |
| ------------------------------ | -------------- | ----------------------------------------- |
| `@gakwaya/entities`          | Domain         | Shared types only — zero internal deps    |
| `@gakwaya/semantic-registry` | Infrastructure | Runtime entity registry                   |
| `@gakwaya/state-manager`     | Infrastructure | App state tracking and diffing            |
| `@gakwaya/memory`            | Infrastructure | Working, episodic, semantic memory        |
| `@gakwaya/llm`               | Infrastructure | LLM client with prompts and cost tracking |
| `@gakwaya/tools`             | Infrastructure | Tool registry, built-ins, composition     |
| `@gakwaya/planner`           | Infrastructure | Task decomposition                        |
| `@gakwaya/workflow`          | Infrastructure | Workflow orchestration engine             |
| `@gakwaya/multi-agent`       | Infrastructure | Specialized agent routing                 |
| `@gakwaya/learning`          | Infrastructure | Pattern learning and replay               |
| `@gakwaya/core`              | Orchestration  | ReAct loop — composes all infrastructure  |
| `@gakwaya/ui`                | Presentation   | Panel and visual feedback                 |
| `@gakwaya/app-agent`         | Public API     | Facade — **only consumer-facing import**  |
| `@gakwaya/integrations-shared` | Integration  | Shared agent context for frameworks     |
| `@gakwaya/integrations-react` | Integration | React Provider + hooks                  |
| `@gakwaya/integrations-vue`  | Integration  | Vue Provider + composable                 |
| `@gakwaya/integrations-svelte` | Integration | Svelte store + context                  |

## Layer Rules

```
entities          → (nothing)
infrastructure    → entities only
core              → entities + infrastructure (NOT ui, NOT app-agent)
ui                → entities + core types
app-agent facade  → all public packages
```

Enforced by `pnpm arch:check` (dependency-cruiser).

## Where to Add Features

| Feature type              | Target package                  |
| ------------------------- | ------------------------------- |
| New domain type/interface | `@gakwaya/entities`           |
| Entity registration/query | `@gakwaya/semantic-registry`  |
| New built-in tool         | `@gakwaya/tools/src/builtin/` |
| New LLM prompt template   | `@gakwaya/llm`                |
| ReAct loop behavior       | `@gakwaya/core`               |
| UI component              | `@gakwaya/ui`                 |
| Public API change         | `@gakwaya/app-agent` + ADR    |

## ADRs

Architectural decisions: [docs/adr/README.md](./docs/adr/README.md)

Write an ADR before:

- Adding a new package
- Changing layer dependency rules
- Introducing a new persistence or integration pattern

## Commands

```bash
pnpm install
pnpm validate    # typecheck + lint + test + arch:check
pnpm build
pnpm test
```

## Research Archive

Historical research and vision docs live in `../rnd/`. Canonical architecture: [docs/architecture.md](./docs/architecture.md).
