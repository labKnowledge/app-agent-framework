#!/usr/bin/env node
/**
 * Deprecate legacy @gakwaya/* npm package names after rename to @gakwaya/app-agent-*.
 * Run after publishing 0.2.0 under new names. Requires npm auth (NPM_TOKEN or npm login).
 *
 * Usage: tsx scripts/deprecate-legacy-packages.ts [--dry-run]
 */

import { execSync } from 'node:child_process';

const LEGACY_TO_NEW: Record<string, string> = {
  '@gakwaya/core': '@gakwaya/app-agent-core',
  '@gakwaya/entities': '@gakwaya/app-agent-entities',
  '@gakwaya/ui': '@gakwaya/app-agent-ui',
  '@gakwaya/semantic-registry': '@gakwaya/app-agent-semantic-registry',
  '@gakwaya/state-manager': '@gakwaya/app-agent-state-manager',
  '@gakwaya/memory': '@gakwaya/app-agent-memory',
  '@gakwaya/llm': '@gakwaya/app-agent-llm',
  '@gakwaya/tools': '@gakwaya/app-agent-tools',
  '@gakwaya/planner': '@gakwaya/app-agent-planner',
  '@gakwaya/workflow': '@gakwaya/app-agent-workflow',
  '@gakwaya/multi-agent': '@gakwaya/app-agent-multi-agent',
  '@gakwaya/learning': '@gakwaya/app-agent-learning',
  '@gakwaya/integrations-shared': '@gakwaya/app-agent-integrations-shared',
  '@gakwaya/integrations-react': '@gakwaya/app-agent-react',
  '@gakwaya/integrations-vue': '@gakwaya/app-agent-vue',
  '@gakwaya/integrations-svelte': '@gakwaya/app-agent-svelte',
};

const DOCS =
  'https://github.com/labKnowledge/app-agent-framework/blob/main/app-agent/docs/packages.md';

const dryRun = process.argv.includes('--dry-run');

for (const [legacy, next] of Object.entries(LEGACY_TO_NEW)) {
  const message = `Renamed to ${next}. See ${DOCS}`;
  const cmd = `npm deprecate "${legacy}" "${message}"`;
  console.log(dryRun ? `[dry-run] ${cmd}` : cmd);
  if (!dryRun) {
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch {
      console.error(`Failed to deprecate ${legacy}`);
      process.exitCode = 1;
    }
  }
}

console.log(dryRun ? 'Dry run complete.' : 'Deprecation complete.');
