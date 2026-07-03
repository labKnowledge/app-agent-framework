# ADR-0007: Multi-Agent Coordinator

## Status

Accepted

## Decision Drivers

- Phase 2 roadmap requires specialized agents for different domains
- Tasks like navigation vs commerce benefit from capability-based routing
- Must not duplicate full ReAct loops per agent

## Decision Outcome

Add `@gakwaya/multi-agent` infrastructure package with:

- `MultiAgentCoordinator` — registers agents, scores tasks by capability keywords
- `SpecializedAgent` interface — thin wrappers that delegate to core `execute()`
- Built-in `NavigationAgent` and `CommerceAgent`

### Layer Rules

`@gakwaya/multi-agent` → `@gakwaya/entities` only

### Integration

- Opt-in via `enableMultiAgent` on `AgentConfig`
- Core selects best agent before ReAct loop; agent prepends domain context to task

## Validation

- Unit tests for routing scores and delegation
- Optional custom agents via `customAgents` config map
