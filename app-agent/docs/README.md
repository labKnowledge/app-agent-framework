# App-Agent Documentation

Central index for the `@gakwaya/*` framework monorepo.

## Start here

| Document | Audience | Description |
|----------|----------|-------------|
| [Getting Started](./getting-started.md) | App developers | Install, configure, framework integrations |
| [Architecture](./architecture.md) | Contributors | Layers, packages, data flow |
| [Packages](./packages.md) | Everyone | All published packages and roles |
| [Publishing](./publishing.md) | Maintainers | npm releases and changesets |

## For contributors

| Document | Description |
|----------|-------------|
| [Contributing](../CONTRIBUTING.md) | Setup, commands, PR checklist |
| [Agent Guide (AGENTS.md)](../AGENTS.md) | Package map, layer rules, where to add code |
| [ADRs](./adr/README.md) | Architecture decision records |
| [Project progress](./project/progress.md) | Phase status and testing summary |

## Guides

| Document | Description |
|----------|-------------|
| [Examples](../examples/) | Vanilla, React, Vue, Svelte demo apps |
| [Research archive](../../rnd/README.md) | Original vision, competitive research, roadmap |

## Historical archive

Point-in-time summaries kept for reference (not maintained as canonical docs):

- [Implementation summary (verification pass)](./archive/implementation-summary.md)
- [Project summary](./archive/project-summary.md)
- [Week 2 complete](./archive/week2-complete.md)
- [Week 2 summary](./archive/week2-summary.md)

## Known bugs

| ID | Summary |
|----|---------|
| [BUG-0001](./bugs/BUG-0001-react-strictmode-disposed-agent.md) | React StrictMode + `AppAgentProvider` → immediate "Task aborted by user" (0 steps) |
| [BUG-0002](./bugs/BUG-0002-prompt-action-format-mismatch.md) | Prompt `action_name` placeholder → `Unknown action: action_name` on every step |
| [BUG-0003](./bugs/BUG-0003-dom-content-not-in-prompt.md) | Dehydrated DOM element list never sent to the LLM |
| [BUG-0004](./bugs/BUG-0004-mui-interactive-detection.md) | MUI/ARIA controls not indexed → empty `content` on SPAs |
| [BUG-0005](./bugs/BUG-0005-no-navigate-tool.md) | No `navigate` tool; model invents `navigate_to_url` |
| [BUG-0006](./bugs/BUG-0006-dom-cache-stale-after-spa-nav.md) | DOM cache not invalidated on client-side route changes |

## Package READMEs

Per-package notes live next to source (for npm where published):

- [`@gakwaya/app-agent`](../packages/app-agent/README.md) — public facade (npm homepage content)
- Infrastructure packages: `packages/*/README.md` where present
