# ADR-0004: Public Facade Package

## Status

Accepted

## Decision Drivers

- README documents `import { AppAgent } from '@gakwaya/app-agent'` but package did not exist
- Consumers should not need to wire core, registry, workflow, and UI separately
- Stable public API separate from internal orchestration

## Considered Options

1. Export everything from `@gakwaya/core`
2. Create `@gakwaya/app-agent` facade package
3. Per-framework integration packages only

## Decision Outcome

**Chosen option**: `@gakwaya/app-agent` is the only consumer-facing import.

- Thin `AppAgent` class wraps `AppAgentCore`
- Maps `entities`/`workflows` config to `SemanticRegistry` + `WorkflowEngine`
- Re-exports commonly needed types from `@gakwaya/entities`
- Re-exports `AppAgentPanel` from `@gakwaya/ui`

### Positive Consequences

- Matches documented quick-start API
- Internal refactors don't break consumers
- Framework integrations can depend on facade only

### Negative Consequences

- Extra indirection layer
- Facade must stay in sync with core config options

## Validation

- `examples/basic-example.ts` imports from `@gakwaya/app-agent`
- Facade integration test passes
