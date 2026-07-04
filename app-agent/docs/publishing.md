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

## Production storage

For cross-session chat and memory without exposing LLM keys in the browser:

- Use `RemoteStorageAdapter` from `@gakwaya/app-agent-entities` with a backend API implementing `StoragePort`
- Proxy LLM calls through your server; pass `baseURL` to your proxy endpoint

```typescript
import { RemoteStorageAdapter } from '@gakwaya/app-agent-entities';

<AppAgentSessionProvider
  persistSession
  storage={new RemoteStorageAdapter({ baseUrl: '/api/agent-storage', authHeader: `Bearer ${token}` })}
  config={{ ... }}
/>
```

- Production builds use **terser minify + light obfuscation**
- Faster local builds: `SKIP_OBFUSCATE=1 pnpm build`

## Deprecating legacy package names

After publishing under `@gakwaya/app-agent-*` names, legacy flat `@gakwaya/*` packages were deprecated:

```bash
pnpm exec tsx scripts/deprecate-legacy-packages.ts
```

**Deprecation does not remove packages from npmjs.com listings** — they still appear on the `@gakwaya` scope page with a strikethrough/warning.

To **remove legacy names entirely** from npm (recommended after rename):

### Option A — Delete on the website (works with Security Key 2FA)

npm documents this explicitly: [Unpublish using the website](https://docs.npmjs.com/unpublishing-packages-from-the-registry/#using-the-website)

For each legacy package (example `@gakwaya/core`):

1. Open `https://www.npmjs.com/package/@gakwaya/core`
2. **Settings** tab → **Delete package**
3. Confirm (browser handles Security Key / biometrics)

Repeat for all 16 flat names. **Do not delete** `@gakwaya/app-agent`.

### Option B — Granular token with Bypass 2FA (CLI)

CLI `npm unpublish` often fails with **E403** and does **not** prompt for OTP when the registry returns 403 instead of EOTP ([npm/cli#4519](https://github.com/npm/cli/issues/4519)). Your debug log shows exactly that pattern. Email login OTP and `--otp=` do not apply to Security Key accounts.

1. [Access Tokens](https://www.npmjs.com/settings/gakwaya/tokens) → **Generate New Token** → Granular
2. **Read and write** on `@gakwaya/*` packages
3. Check **Bypass two-factor authentication**
4. Replace `//registry.npmjs.org/:_authToken=` in `~/.npmrc` with the new token only
5. `npm unpublish @gakwaya/core --force` (repeat per package, or use `scripts/unpublish-legacy-packages.ts`)

Do **not** unpublish `@gakwaya/app-agent` — that name is kept for the public facade.

## Scope history

1. Packages originally used `@app-agent/*` but that org was unavailable for publish.
2. Scope migrated to flat `@gakwaya/*` (0.1.x).
3. As of 0.2.0, modules renamed to `@gakwaya/app-agent-*` prefix ([ADR-0009](./adr/ADR-0009-prefixed-package-names.md)).
