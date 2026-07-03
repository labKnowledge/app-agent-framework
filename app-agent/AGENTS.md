# App-Agent — Agent Guide

Application Intelligence Framework monorepo. AI agents that understand entire web applications.

## Package Map

| Package | Layer | Purpose |
|---------|-------|---------|
| `@app-agent/entities` | Domain | Shared types only — zero internal deps |
| `@app-agent/semantic-registry` | Infrastructure | Runtime entity registry |
| `@app-agent/state-manager` | Infrastructure | App state tracking and diffing |
| `@app-agent/memory` | Infrastructure | Working, episodic, semantic memory |
| `@app-agent/llm` | Infrastructure | LLM client with prompts and cost tracking |
| `@app-agent/tools` | Infrastructure | Tool registry, built-ins, composition |
| `@app-agent/planner` | Infrastructure | Task decomposition |
| `@app-agent/workflow` | Infrastructure | Workflow orchestration engine |
| `@app-agent/core` | Orchestration | ReAct loop — composes all infrastructure |
| `@app-agent/ui` | Presentation | Panel and visual feedback |
| `@app-agent/app-agent` | Public API | Facade — **only consumer-facing import** |

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

| Feature type | Target package |
|--------------|----------------|
| New domain type/interface | `@app-agent/entities` |
| Entity registration/query | `@app-agent/semantic-registry` |
| New built-in tool | `@app-agent/tools/src/builtin/` |
| New LLM prompt template | `@app-agent/llm` |
| ReAct loop behavior | `@app-agent/core` |
| UI component | `@app-agent/ui` |
| Public API change | `@app-agent/app-agent` + ADR |

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
