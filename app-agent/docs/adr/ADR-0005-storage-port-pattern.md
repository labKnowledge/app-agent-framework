# ADR-0005: Storage Port Pattern

## Status

Accepted

## Decision Drivers

- `MemoryManager` and `WorkflowEngine` hard-coded `localStorage`
- No way to test persistence without browser globals
- Future need for IndexedDB or in-memory storage in tests

## Considered Options

1. Keep direct `localStorage` access
2. Injectable `StoragePort` interface with default adapter
3. Full repository pattern with separate persistence package

## Decision Outcome

**Chosen option**: Injectable `StoragePort` in `@app-agent/entities`.

```typescript
interface StoragePort {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
```

Default: `LocalStorageAdapter` when `typeof localStorage !== 'undefined'`.

### Positive Consequences

- Testable without browser mocks
- Swappable storage backends
- Consistent persistence API across memory and workflow

### Negative Consequences

- Slight API surface increase in config objects
- Async storage API even for sync localStorage

## Validation

- Memory and workflow accept optional `storage` in config
- Unit tests use `InMemoryStorageAdapter`
