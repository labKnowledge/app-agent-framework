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
pnpm add @gakwaya/integrations-react @gakwaya/ui   # React
```

## Build notes

- Production builds use **terser minify + light obfuscation**
- Faster local builds: `SKIP_OBFUSCATE=1 pnpm build`

## Scope history

Packages originally used `@app-agent/*` but that org was unavailable for publish. The scope was migrated to `@gakwaya/*` for npm; internal monorepo imports match the published scope.
