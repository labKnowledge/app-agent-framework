# @gakwaya/entities

## 1.3.0

### Minor Changes

- Add `informational` to `TaskIntentKind` for assistant-first routing.

## 1.2.0

### Minor Changes

- Add page navigation discovery: extractPageNavigation scans DOM landmarks (header, sidebar, hamburger, footer) for hidden nav links, injects compact Page Navigation context into prompts, and exposes discoverPageNavigationFromDOM React helper.

## 1.1.0

### Minor Changes

- Session-first React integration and Rich App Context Model: navigation/capability registries, validated routing, task classifier, context-first prompts, quiet execution mode, AppAgentSessionProvider, RemoteStorageAdapter, and React Router helpers (`routesToNavigation`, `useAppAgentLiveContext`).

## 1.0.0

### Major Changes

- Rename all modules to `@gakwaya/app-agent-*` prefixed npm names. Legacy `@gakwaya/core`, `@gakwaya/entities`, etc. are deprecated on npm after this release. See ADR-0009 and docs/packages.md.

## 0.1.2

### Patch Changes

- Fix Kidsync production agent failures: StrictMode lifecycle, prompt/action format alignment, DOM observation in prompts, MUI interactive detection, navigate tool, and SPA DOM cache invalidation.

## 0.1.1

### Patch Changes

- Initial public alpha release of the App-Agent framework.
