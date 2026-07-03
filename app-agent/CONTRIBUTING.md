# Contributing to App-Agent

Thank you for contributing to App-Agent. This monorepo uses pnpm workspaces.

## Prerequisites

- Node.js 18+
- pnpm 8+

## Setup

```bash
cd app-agent
pnpm install
```

## Development commands

```bash
pnpm validate      # typecheck + lint + test + arch + build + bundle check
pnpm test:coverage # coverage thresholds
pnpm build         # compile all packages to dist/
pnpm test:e2e      # Playwright smoke tests (run test:e2e:install first)
pnpm bench         # performance benchmarks
```

## Package layers

See [AGENTS.md](./AGENTS.md) and [docs/adr/README.md](./docs/adr/README.md) before adding packages or changing dependency rules.

## Pull requests

1. Keep changes focused and tested.
2. Run `pnpm validate` before opening a PR.
3. Add an ADR for architectural changes.
4. Update docs when public API changes.

## Releases

Releases use [Changesets](https://github.com/changesets/changesets). Add a changeset when your PR should trigger a version bump:

```bash
pnpm changeset
```
