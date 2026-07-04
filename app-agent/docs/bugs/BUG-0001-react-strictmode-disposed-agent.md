# BUG-0001: React StrictMode + AppAgentProvider → immediate "Task aborted by user" (0 steps)

**Status:** Fixed on main (`AppAgentSessionProvider`, ref-count session, StrictMode tests). Consumers on npm ≤0.1.3 should upgrade to `@gakwaya/app-agent-react@1.0.x`.  
**Reported from:** Kidsync app-agent pilot integration  
**Affects:** `@gakwaya/app-agent-react`, `@gakwaya/app-agent-core`  
**Severity:** High — agent unusable in default React 18+ dev setups

## Summary

After mounting `AppAgentProvider`, calling `execute(task)` fails immediately with:

```text
Error: Task aborted by user
steps: 0
```

No user cancellation occurred. The agent never reaches `observe()` / `think()`.

## Reproduction

1. Create a React 18+ app with `<React.StrictMode>` (default in Vite templates).
2. Mount `AppAgentProvider` (optionally inside a dialog or route — not required).
3. Call `execute('What page am I on?')` from `useAppAgent()`.

**Observed:** Console log from core: `[AppAgent] Task execution failed: { task, error: Task aborted by user, steps: 0 }`.

**Expected:** Task enters ReAct loop (`Observing…`, `Thinking…`, etc.).

## Root cause

Two interacting issues:

### 1. `@gakwaya/app-agent-core` — `AbortController` is never reset per task

`AppAgentCore` creates one `AbortController` in the constructor. `dispose()` calls `abortController.abort()` and sets `status = 'disposed'`. `runTask()` checks `abortController.signal.aborted` at the start of each step but **never creates a fresh controller** for a new task.

Once aborted (via `dispose()` or any future cancel API), every subsequent `execute()` fails at step 0.

Relevant code: `packages/core/src/agent.ts` — constructor, `runTask()`, `dispose()`.

### 2. `@gakwaya/app-agent-react` — provider disposes agent on unmount

```tsx
const context = useMemo(() => createAgentContext(config, …), []);
useEffect(() => () => context.dispose(), [context]);
```

React StrictMode (dev) mounts → unmounts → remounts components to surface effect bugs. The cleanup runs `context.dispose()`, which aborts the agent.

Combined with `useMemo(..., [])`:

- Stale `config` is frozen at first mount (separate bug).
- After dispose, if the same context/agent instance is reused, `execute()` hits an already-aborted signal.

Consumers embedding the provider in dialogs, conditional routes, or StrictMode trees hit this routinely.

## Misleading error message

`Task aborted by user` is thrown whenever `abortController.signal.aborted` is true, including after programmatic `dispose()`. Integrators cannot distinguish user cancel from lifecycle teardown.

## Suggested fixes

### Core (`packages/core`)

1. Reset `abortController` at the start of each `runTask()` (fresh cancellation scope per task).
2. Guard `execute()` when `status === 'disposed'` with a distinct error: `Agent has been disposed`.
3. In the step loop, if aborted while `status === 'disposed'`, throw `Agent has been disposed` instead of `Task aborted by user`.
4. Make `dispose()` idempotent (already partially true).

### React integration (`packages/integrations/react`)

1. Replace `useMemo(..., [])` with `useState(() => createAgentContext(...))` so each mount gets a fresh context after StrictMode remount.
2. Keep a `configRef` for dynamic `getAppState` without recreating the agent every render.
3. Optionally recreate context when `agent.status === 'disposed'`.
4. Add a test rendering under `<React.StrictMode>` and asserting `execute()` does not fail with abort at 0 steps (mock LLM).

### Vue / Svelte

Same lifecycle pattern (`onUnmounted` / `onDestroy` dispose) — document StrictMode-equivalent dev double-mount if applicable.

## Consumer workaround (superseded on main)

Use `AppAgentSessionProvider` with `persistSession` instead of a custom module singleton:

```tsx
<AppAgentSessionProvider sessionKey="kidsync" persistSession config={config}>
  <AppAgentShell open={open} onOpenChange={setOpen} launcher={...}>
    <AppAgentConsole />
  </AppAgentShell>
  <Routes>...</Routes>
</AppAgentSessionProvider>
```

Register SPA navigation:

```tsx
onNavigate: (path) => navigate(path),
customTools: {
  markAttendance: { name: 'markAttendance', ... },
},
workflows: {
  attendance: { name: 'attendance', steps: [{ toolName: 'navigate', parameters: { path: '/attendance' } }] },
},
```

Legacy Kidsync `kidsyncAgentSession.ts` can be removed after upgrading to `@gakwaya/app-agent-react@1.0.x`.

## References

- `packages/integrations/react/src/index.tsx`
- `packages/core/src/agent.ts` (`runTask`, `dispose`)
- `packages/integrations/shared/src/index.ts` (`createAgentContext`)
- React Strict Mode: https://react.dev/reference/react/StrictMode
