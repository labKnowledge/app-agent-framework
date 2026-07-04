# ADR-0010: Agent Session Decoupled from Framework Lifecycle

## Status

Accepted

## Decision Drivers

- React StrictMode, HMR, and dialog unmount dispose the agent via `AppAgentProvider` cleanup ([BUG-0001](../bugs/BUG-0001-react-strictmode-disposed-agent.md))
- SPA navigation remounts chat UI when the provider lives inside route/dialog subtrees
- Consumers (Kidsync) required ad-hoc module singletons to work around lifecycle traps
- Cross-session conversation and episodic memory are product requirements for production assistants

## Considered Options

1. Document "mount provider at app shell" only — no framework change
2. Ref-counted module session in `integrations-shared` with optional persistence
3. Move agent runtime to a Web Worker — full decoupling from DOM/React

## Decision Outcome

**Chosen option**: Ref-counted `AgentSessionManager` in `@gakwaya/app-agent-integrations-shared` with:

- `acquireSession()` / `releaseSession()` — StrictMode-safe via deferred dispose microtask
- `AppAgentSessionProvider` — official React binding with `sessionKey` and `persistSession`
- `ConversationStore` — cross-session chat via existing `StoragePort` (ADR-0005)
- `AppAgentShell` — portal-mounted UI surviving route changes
- `IntentRouter` in core — workflow/customTool fast path before ReAct/DOM loop

### Session lifecycle

```
Mount provider → acquireSession (ref++)
Unmount cleanup → releaseSession (ref--)
ref == 0 && !persistSession → queueMicrotask(dispose)
StrictMode remount before microtask → acquire cancels pending dispose
```

### Persistence keys

| Data | Default key |
|------|-------------|
| Conversation | `app-agent:conversation:{sessionKey}` |
| Episodic memory | `app-agent:memory:{sessionKey}` |
| Learning patterns | IndexedDB when `persistSession: true` |

### SPA navigation

`AgentConfig.onNavigate(path)` replaces hardcoded `window.location.assign`. `postNavigateDelayMs` (default 400) allows client routers to settle before DOM re-observe.

## Validation

- `integrations/shared` — StrictMode ref-count tests
- `integrations/react` — StrictMode + execute + onNavigate tests
- `core` — intent-router unit tests

## Related

- [ADR-0006](./ADR-0006-framework-integrations.md) — framework integration layout
- [ADR-0005](./ADR-0005-storage-port-pattern.md) — storage abstraction
- [Kidsync field report](../integration-reports/kidsync-react-plug-and-play-gaps.md)
