# ADR-0008: Learning System

## Status

Accepted

## Decision Drivers

- Phase 2 roadmap requires pattern learning from successful task runs
- Agents should reuse prior successful step sequences
- Browser and Node environments need different storage backends

## Decision Outcome

Add `@gakwaya/learning` infrastructure package with:

- `LearningSystem` — records patterns after successful tasks
- `PatternMatcher` — similarity scoring to find reusable patterns
- `InMemoryPatternStorage` (default) and `IndexedDBPatternStorage` (browser)

### Layer Rules

`@gakwaya/learning` → `@gakwaya/entities` (+ storage port types)

### Integration

- Opt-in via `enableLearning` on `AgentConfig`
- Core calls `findPattern()` before `think()` and injects hint into LLM context
- `onAfterTask` records successful patterns

## Validation

- Unit tests for record, match, TTL pruning
- Demo shop shows faster replay on repeated cart tasks
