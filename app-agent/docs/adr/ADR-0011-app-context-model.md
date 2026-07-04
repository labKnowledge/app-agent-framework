# ADR-0011: App Context Model — Navigation Registry and Capabilities

## Status

Accepted

## Decision Drivers

- Embedded agents must understand **whole-app navigation**, not guess from DOM indices
- Tasks like "change language" were misrouted to profile pages when only DOM + thin `AppState` were available (Kidsync pilot feedback)
- React apps differ; the framework must expose a **portable registration API**, not per-app forks
- Settings/mutations should use **capabilities** (customTools), not blind `navigate()`

## Decision Outcome

**Chosen option:** First-class `NavigationDestination[]` and `AppCapability[]` on `AgentConfig`, with registries in core, validated `navigate`, task classification, and context-first prompts.

### Types (`@gakwaya/app-agent-entities`)

- `NavigationDestination` — id, path, label, aliases, category, navigable
- `AppCapability` — id, kind (`setting` | `mutation` | `query`), toolName, aliases
- `AppContextSnapshot` — merged view for prompts

### Execution order (before ReAct)

1. Match capability (especially `setting` or `query`)
2. Match informational intent → ReAct answer (assistant mode, default)
3. Match navigation intent → validated navigate (explicit go/open/navigate, or any match in agent mode)
4. Workflow / learning replay
5. DOM ReAct loop (fallback)

### Assistant-first behavior (default since ADR-0012)

`behaviorMode: 'assistant'` (default) classifies question-shaped tasks as `informational` and skips navigation fast-path unless the user uses explicit navigation verbs (`go to`, `open`, `navigate`, etc.). Prompts instruct the model to answer from Application State with `{ "done": true, "memory": "..." }` before clicking or navigating.

Use `behaviorMode: 'agent'` to restore legacy fuzzy navigation matching on route aliases.

### Validated navigation

When `navigation` is registered, `strictNavigation` defaults to `true`. The `navigate` tool rejects unknown paths.

### Quiet execution

`executionMode: 'quiet'` suppresses per-step UI activity; host shows final result.

## Validation

- `"change language"` routes to `changeLanguage` capability, not `/profile`
- Unregistered paths rejected under strict mode
- Prompts list app map before DOM

## Related

- [ADR-0010](./ADR-0010-agent-session-decoupling.md)
- [BUG-0007](../bugs/BUG-0007-wrong-navigation-language-profile.md)
