#!/usr/bin/env node
/**
 * Unpublish legacy flat @gakwaya/* packages from npm.
 *
 * ORDER MATTERS: npm's unpublish policy blocks removal of any package that
 * still has another *published* package depending on it — even your own.
 * This list is ordered leaf-to-root based on the actual dependency graph
 * pulled from the registry on 2026-07-03:
 *
 *   integrations-react, integrations-vue, integrations-shared
 *     -> ui, entities, app-agent
 *   ui -> core, entities
 *   core -> llm, tools, memory, planner, entities, learning,
 *           workflow, multi-agent, state-manager, semantic-registry
 *   semantic-registry, state-manager, memory, llm, tools,
 *   planner, workflow, multi-agent, learning -> entities
 *   entities -> (nothing)
 *
 * So entities must go LAST, core must go after ui but before its own
 * dependencies, and the integrations-* packages go FIRST.
 *
 * Note: @gakwaya/integrations-svelte returned 404 on the registry as of
 * 2026-07-03 — it may never have been published. Verify before including it.
 *
 * Usage:
 *   pnpm exec tsx scripts/unpublish-legacy-packages.ts --dry-run
 *   pnpm exec tsx scripts/unpublish-legacy-packages.ts --otp=123456
 */

import { execSync } from 'node:child_process';

const LEGACY_PACKAGES_IN_ORDER = [
  '@gakwaya/integrations-react',
  '@gakwaya/integrations-vue',
  // '@gakwaya/integrations-svelte', // 404 on registry — confirm it exists before uncommenting
  '@gakwaya/integrations-shared',
  '@gakwaya/ui',
  '@gakwaya/core',
  '@gakwaya/semantic-registry',
  '@gakwaya/state-manager',
  '@gakwaya/memory',
  '@gakwaya/llm',
  '@gakwaya/tools',
  '@gakwaya/planner',
  '@gakwaya/workflow',
  '@gakwaya/multi-agent',
  '@gakwaya/learning',
  '@gakwaya/entities', // must be last — everything else depends on this
];

const dryRun = process.argv.includes('--dry-run');
const otpArg = process.argv.find((a) => a.startsWith('--otp='));

for (const pkg of LEGACY_PACKAGES_IN_ORDER) {
  const cmd = `npm unpublish "${pkg}" --force${otpArg ? ` ${otpArg}` : ''}`;
  console.log(dryRun ? `[dry-run] ${cmd}` : cmd);
  if (!dryRun) {
    try {
      execSync(cmd, { stdio: 'inherit' });
      console.log(`OK ${pkg}`);
    } catch {
      console.error(`FAILED ${pkg}`);
      console.error(
        'If this still 422s, check registry.npmjs.org/<pkg> for remaining dependents ' +
          '(e.g. from packages not in this list, like @gakwaya/app-agent) before retrying.'
      );
      process.exitCode = 1;
      break;
    }
  }
}

console.log(dryRun ? 'Dry run complete.' : 'Done.');