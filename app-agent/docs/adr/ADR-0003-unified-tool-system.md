# ADR-0003: Unified Tool System

## Status

Accepted

## Decision Drivers

- Duplicate `Tool` interfaces in `core` and `@gakwaya/tools`
- Built-in tools defined inline in `agent.ts` (~90 lines)
- `ToolRegistry` in tools package was unused

## Considered Options

1. Keep tools in `core` only
2. Migrate to `@gakwaya/tools` as canonical system
3. Merge both into new package

## Decision Outcome

**Chosen option**: `@gakwaya/tools` is canonical.

- `AgentTool` base contract lives in `@gakwaya/entities`
- `Tool` in tools package extends `AgentTool` with `id`, `category`, `metadata`
- Built-in tools live in `tools/src/builtin/`
- `core` delegates registration and execution to `ToolRegistry`

### Positive Consequences

- Single tool discovery/composition system
- Custom tools use same registry as built-ins
- Core agent stays focused on orchestration

### Negative Consequences

- Migration effort for existing `customTools` config shape
- Adapter layer needed for legacy tool definitions

## Validation

- Core imports `ToolRegistry` from `@gakwaya/tools`
- No `Map<string, Tool>` in `agent.ts` after migration
