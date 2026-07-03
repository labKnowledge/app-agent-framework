# ADR-0002: entities vs semantic-registry Split

## Status

Accepted

## Decision Drivers

- `state-manager` and `core` had bidirectional coupling via `AppState` type
- Entity types needed by multiple packages without runtime dependencies
- Semantic registry needs runtime behavior (register, query, lifecycle hooks)

## Considered Options

1. Single `semantic-registry` package (types + runtime)
2. Split: `@app-agent/entities` (types) + `@app-agent/semantic-registry` (runtime)
3. Keep types in `core`

## Decision Outcome

**Chosen option**: Split types and runtime.

- `@app-agent/entities` — pure TypeScript interfaces, Zod schemas, zero `@app-agent/*` deps
- `@app-agent/semantic-registry` — `SemanticRegistry` class, imports types from `entities`

### Positive Consequences

- Breaks core ↔ state-manager circular type dependency
- Infrastructure packages depend only on domain types
- Types compile without pulling in EventEmitter or storage

### Negative Consequences

- Two packages for one conceptual feature
- Type changes may require updates in both packages

## Validation

- `entities-is-pure` rule in dependency-cruiser
- `state-manager` imports `AppState` from `@app-agent/entities`, not `core`
