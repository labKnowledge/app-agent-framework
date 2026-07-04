# ADR-0012: Assistant-First Behavior Mode

## Status

Accepted

## Context

Users expect an embedded AI assistant to **answer questions** from application state ("what's in my cart?") without navigating to pages. The action-first routing from ADR-0011 matched route aliases on token overlap, causing informational messages to trigger `runNavigationTask()` before the ReAct loop could respond with `{ "done": true }`.

## Decision

Add `behaviorMode: 'assistant' | 'agent'` to `AgentConfig` with **`assistant` as the default**.

### Assistant mode

1. Classify question-shaped tasks as `informational` (patterns: `what`, `how`, `tell me`, `?`, etc.)
2. Skip navigation fast-path unless explicit navigation verbs are present (`go to`, `open`, `navigate`, etc.)
3. Inject assistant-first prompt rules: answer from Application State before UI actions

### Agent mode (legacy)

Preserve fuzzy navigation matching on registered route aliases without requiring explicit navigation phrasing.

## Consequences

- Host apps that relied on single-word navigation ("cart" → `/cart`) should set `behaviorMode: 'agent'` or prompt users with explicit navigation language
- Register `kind: 'query'` capabilities for structured read-only answers where ReAct alone is insufficient

## Related

- [ADR-0011](./ADR-0011-app-context-model.md)
- [Integration guide](../integration-guide.md)
