# App-Agent — Agent Guide

Application Intelligence Framework monorepo. AI agents that understand entire web applications.

## Package Map

| Package                        | Layer          | Purpose                                   |
| ------------------------------ | -------------- | ----------------------------------------- |
| `@gakwaya/app-agent-entities`          | Domain         | Shared types only — zero internal deps    |
| `@gakwaya/app-agent-semantic-registry` | Infrastructure | Runtime entity registry                   |
| `@gakwaya/app-agent-state-manager`     | Infrastructure | App state tracking and diffing            |
| `@gakwaya/app-agent-memory`            | Infrastructure | Working, episodic, semantic memory        |
| `@gakwaya/app-agent-llm`               | Infrastructure | LLM client with prompts and cost tracking |
| `@gakwaya/app-agent-tools`             | Infrastructure | Tool registry, built-ins, composition     |
| `@gakwaya/app-agent-planner`           | Infrastructure | Task decomposition                        |
| `@gakwaya/app-agent-workflow`          | Infrastructure | Workflow orchestration engine             |
| `@gakwaya/app-agent-multi-agent`       | Infrastructure | Specialized agent routing                 |
| `@gakwaya/app-agent-learning`          | Infrastructure | Pattern learning and replay               |
| `@gakwaya/app-agent-core`              | Orchestration  | ReAct loop — composes all infrastructure  |
| `@gakwaya/app-agent-ui`                | Presentation   | Panel and visual feedback                 |
| `@gakwaya/app-agent`         | Public API     | Facade — **only consumer-facing import**  |
| `@gakwaya/app-agent-integrations-shared` | Integration  | Shared agent context for frameworks     |
| `@gakwaya/app-agent-react` | Integration | React Provider + hooks                  |
| `@gakwaya/app-agent-vue`  | Integration  | Vue Provider + composable                 |
| `@gakwaya/app-agent-svelte` | Integration | Svelte store + context                  |

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
| New domain type/interface | `@gakwaya/app-agent-entities`           |
| Entity registration/query | `@gakwaya/app-agent-semantic-registry`  |
| New built-in tool         | `@gakwaya/app-agent-tools/src/builtin/` |
| New LLM prompt template   | `@gakwaya/app-agent-llm`                |
| ReAct loop behavior       | `@gakwaya/app-agent-core`               |
| UI component              | `@gakwaya/app-agent-ui`                 |
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

Historical research and vision docs live in [`../rnd/README.md`](../rnd/README.md). Canonical docs: [docs/README.md](./docs/README.md) · [architecture.md](./docs/architecture.md).
