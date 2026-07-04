# @gakwaya/integrations-react

## 1.3.0

### Patch Changes

- Updated dependencies
  - @gakwaya/app-agent@1.3.0
  - @gakwaya/app-agent-integrations-shared@1.3.0

## 1.2.0

### Minor Changes

- Add page navigation discovery: extractPageNavigation scans DOM landmarks (header, sidebar, hamburger, footer) for hidden nav links, injects compact Page Navigation context into prompts, and exposes discoverPageNavigationFromDOM React helper.

### Patch Changes

- Updated dependencies
  - @gakwaya/app-agent@1.2.0
  - @gakwaya/app-agent-entities@1.2.0
  - @gakwaya/app-agent-ui@1.2.0
  - @gakwaya/app-agent-integrations-shared@1.2.0

## 1.1.0

### Minor Changes

- Session-first React integration and Rich App Context Model: navigation/capability registries, validated routing, task classifier, context-first prompts, quiet execution mode, AppAgentSessionProvider, RemoteStorageAdapter, and React Router helpers (`routesToNavigation`, `useAppAgentLiveContext`).

### Patch Changes

- Updated dependencies
  - @gakwaya/app-agent@1.1.0
  - @gakwaya/app-agent-entities@1.1.0
  - @gakwaya/app-agent-ui@1.1.0
  - @gakwaya/app-agent-integrations-shared@1.1.0

## 1.0.0

### Major Changes

- Rename all modules to `@gakwaya/app-agent-*` prefixed npm names. Legacy `@gakwaya/core`, `@gakwaya/entities`, etc. are deprecated on npm after this release. See ADR-0009 and docs/packages.md.

### Patch Changes

- Updated dependencies
  - @gakwaya/app-agent@1.0.0
  - @gakwaya/app-agent-entities@1.0.0
  - @gakwaya/app-agent-ui@1.0.0
  - @gakwaya/app-agent-integrations-shared@1.0.0

## 0.1.3

### Patch Changes

- Fix Kidsync production agent failures: StrictMode lifecycle, prompt/action format alignment, DOM observation in prompts, MUI interactive detection, navigate tool, and SPA DOM cache invalidation.
- Updated dependencies
  - @gakwaya/entities@0.1.2
  - @gakwaya/app-agent@0.1.3
  - @gakwaya/integrations-shared@0.1.3
  - @gakwaya/ui@0.1.2

## 0.1.2

### Patch Changes

- Updated dependencies
  - @gakwaya/app-agent@0.1.2
  - @gakwaya/integrations-shared@0.1.2

## 0.1.1

### Patch Changes

- Initial public alpha release of the App-Agent framework.
- Updated dependencies
  - @gakwaya/entities@0.1.1
  - @gakwaya/ui@0.1.1
  - @gakwaya/app-agent@0.1.1
  - @gakwaya/integrations-shared@0.1.1
