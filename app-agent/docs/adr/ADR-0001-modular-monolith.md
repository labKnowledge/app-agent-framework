# ADR-0001: Modular Monolith Package Structure

## Status

Accepted

## Decision Drivers

- Client-side framework with no backend infrastructure
- Growing feature set (memory, planning, workflows, semantic registry)
- Need clear boundaries without distributed-system complexity
- Solo/small-team development velocity

## Considered Options

1. Single package monolith
2. Modular monolith (pnpm workspace with layered packages)
3. Microservices

## Decision Outcome

**Chosen option**: Modular monolith with pnpm workspace and enforced layer rules.

### Layer Model

| Layer          | Packages                                                                              |
| -------------- | ------------------------------------------------------------------------------------- |
| Domain         | `@gakwaya/app-agent-entities`                                                                 |
| Infrastructure | `state-manager`, `memory`, `llm`, `tools`, `planner`, `workflow`, `semantic-registry` |
| Orchestration  | `@gakwaya/app-agent-core`                                                                     |
| Presentation   | `@gakwaya/app-agent-ui`                                                                       |
| Public API     | `@gakwaya/app-agent`                                                                |

### Positive Consequences

- Clear ownership per concern
- Enforceable boundaries via dependency-cruiser
- Incremental extraction possible later

### Negative Consequences

- More packages to maintain
- Workspace dependency wiring required

## Validation

- `pnpm arch:check` enforces layer rules
- No circular dependencies between packages
