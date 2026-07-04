# @gakwaya/core

## 1.3.0

### Minor Changes

- Add assistant-first behavior mode (`behaviorMode: 'assistant' | 'agent'`, default `assistant`). Informational questions answer from app state instead of triggering navigation fast-path; explicit go/open/navigate still routes to registered pages. Includes intent detection, updated prompts, and ADR-0012.

### Patch Changes

- Updated dependencies
  - @gakwaya/app-agent-entities@1.3.0

## 1.2.0

### Minor Changes

- Add page navigation discovery: extractPageNavigation scans DOM landmarks (header, sidebar, hamburger, footer) for hidden nav links, injects compact Page Navigation context into prompts, and exposes discoverPageNavigationFromDOM React helper.

### Patch Changes

- Updated dependencies
  - @gakwaya/app-agent-entities@1.2.0
  - @gakwaya/app-agent-semantic-registry@1.2.0
  - @gakwaya/app-agent-state-manager@1.2.0
  - @gakwaya/app-agent-memory@1.2.0
  - @gakwaya/app-agent-llm@1.2.0
  - @gakwaya/app-agent-tools@1.2.0
  - @gakwaya/app-agent-planner@1.2.0
  - @gakwaya/app-agent-workflow@1.2.0
  - @gakwaya/app-agent-multi-agent@1.2.0
  - @gakwaya/app-agent-learning@1.2.0

## 1.1.0

### Minor Changes

- Session-first React integration and Rich App Context Model: navigation/capability registries, validated routing, task classifier, context-first prompts, quiet execution mode, AppAgentSessionProvider, RemoteStorageAdapter, and React Router helpers (`routesToNavigation`, `useAppAgentLiveContext`).

### Patch Changes

- Updated dependencies
  - @gakwaya/app-agent-entities@1.1.0
  - @gakwaya/app-agent-semantic-registry@1.1.0
  - @gakwaya/app-agent-state-manager@1.1.0
  - @gakwaya/app-agent-memory@1.1.0
  - @gakwaya/app-agent-llm@1.1.0
  - @gakwaya/app-agent-tools@1.1.0
  - @gakwaya/app-agent-planner@1.1.0
  - @gakwaya/app-agent-workflow@1.1.0
  - @gakwaya/app-agent-multi-agent@1.1.0
  - @gakwaya/app-agent-learning@1.1.0

## 1.0.0

### Major Changes

- Rename all modules to `@gakwaya/app-agent-*` prefixed npm names. Legacy `@gakwaya/core`, `@gakwaya/entities`, etc. are deprecated on npm after this release. See ADR-0009 and docs/packages.md.

### Patch Changes

- Updated dependencies
  - @gakwaya/app-agent-entities@1.0.0
  - @gakwaya/app-agent-semantic-registry@1.0.0
  - @gakwaya/app-agent-state-manager@1.0.0
  - @gakwaya/app-agent-memory@1.0.0
  - @gakwaya/app-agent-llm@1.0.0
  - @gakwaya/app-agent-tools@1.0.0
  - @gakwaya/app-agent-planner@1.0.0
  - @gakwaya/app-agent-workflow@1.0.0
  - @gakwaya/app-agent-multi-agent@1.0.0
  - @gakwaya/app-agent-learning@1.0.0

## 0.1.2

### Patch Changes

- Fix Kidsync production agent failures: StrictMode lifecycle, prompt/action format alignment, DOM observation in prompts, MUI interactive detection, navigate tool, and SPA DOM cache invalidation.
- Updated dependencies
  - @gakwaya/entities@0.1.2
  - @gakwaya/llm@0.1.2
  - @gakwaya/tools@0.1.2
  - @gakwaya/learning@0.1.2
  - @gakwaya/memory@0.1.2
  - @gakwaya/multi-agent@0.1.2
  - @gakwaya/planner@0.1.2
  - @gakwaya/semantic-registry@0.1.2
  - @gakwaya/state-manager@0.1.2
  - @gakwaya/workflow@0.1.2

## 0.1.1

### Patch Changes

- Initial public alpha release of the App-Agent framework.
- Updated dependencies
  - @gakwaya/entities@0.1.1
  - @gakwaya/state-manager@0.1.1
  - @gakwaya/memory@0.1.1
  - @gakwaya/llm@0.1.1
  - @gakwaya/tools@0.1.1
  - @gakwaya/planner@0.1.1
  - @gakwaya/workflow@0.1.1
  - @gakwaya/semantic-registry@0.1.1
  - @gakwaya/multi-agent@0.1.1
  - @gakwaya/learning@0.1.1
