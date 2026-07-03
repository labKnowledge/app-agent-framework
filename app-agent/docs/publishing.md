# Publishing

Libraries publish to npm under the **`@gakwaya`** scope (account: `gakwaya`).

## What gets published

Each package tarball includes **only essentials**:

- `dist/` — compiled ESM + TypeScript declarations
- `README.md` — when present (required for `@gakwaya/app-agent`)
- `package.json`

Source, tests, examples, and monorepo tooling are **not** published. The workspace root is `"private": true`.

## Release workflow

```bash
cd app-agent
pnpm build
pnpm changeset          # describe changes, select packages
pnpm version-packages   # bump versions, update changelogs
pnpm release            # build + changeset publish
```

CI also runs [release.yml](../../.github/workflows/release.yml) via Changesets action (requires `NPM_TOKEN`).

## Verify before release

```bash
pnpm validate
pnpm pack:smoke         # tarball layout for @gakwaya/app-agent
```

## Install in a consumer project

```bash
pnpm add @gakwaya/app-agent
pnpm add @gakwaya/app-agent-react @gakwaya/app-agent-ui   # React
```

## Build notes

- Production builds use **terser minify + light obfuscation**
- Faster local builds: `SKIP_OBFUSCATE=1 pnpm build`

## Deprecating legacy package names

After publishing **0.2.0** under `@gakwaya/app-agent-*` names, deprecate the old flat `@gakwaya/*` packages (requires npm auth):

```bash
pnpm exec tsx scripts/deprecate-legacy-packages.ts --dry-run   # preview
pnpm exec tsx scripts/deprecate-legacy-packages.ts            # apply
```

Do **not** unpublish legacy packages — deprecation preserves existing lockfiles while steering users to new names.

## Scope history

1. Packages originally used `@app-agent/*` but that org was unavailable for publish.
2. Scope migrated to flat `@gakwaya/*` (0.1.x).
3. As of 0.2.0, modules renamed to `@gakwaya/app-agent-*` prefix ([ADR-0009](./adr/ADR-0009-prefixed-package-names.md)).
