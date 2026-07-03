#!/usr/bin/env node
/**
 * Bundle size budget check — measures gzip size of built dist/ artifacts.
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES_DIR = join(ROOT, 'packages');

/** Gzip budget in KB for primary dist entry */
const BUDGETS_KB_GZIP: Record<string, number> = {
  '@gakwaya/app-agent-entities': 5,
  '@gakwaya/app-agent-core': 100,
  '@gakwaya/app-agent-tools': 40,
  '@gakwaya/app-agent-llm': 30,
  '@gakwaya/app-agent': 100,
  '@gakwaya/app-agent-ui': 30,
};

function gzipSizeKb(filePath: string): number {
  const content = readFileSync(filePath);
  return gzipSync(content).length / 1024;
}

function findPackageDirs(dir: string): string[] {
  const dirs: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name === 'integrations') {
      for (const sub of readdirSync(full, { withFileTypes: true })) {
        if (sub.isDirectory() && existsSync(join(full, sub.name, 'package.json'))) {
          dirs.push(join(full, sub.name));
        }
      }
      continue;
    }
    if (existsSync(join(full, 'package.json'))) dirs.push(full);
  }
  return dirs;
}

function getPackageName(packageDir: string): string {
  const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
  return pkg.name as string;
}

let failed = false;

console.log('Bundle size check (dist gzip KB budgets):\n');

for (const packageDir of findPackageDirs(PACKAGES_DIR)) {
  const name = getPackageName(packageDir);
  const budget = BUDGETS_KB_GZIP[name];
  if (!budget) continue;

  const distEntry = join(packageDir, 'dist', 'index.js');
  if (!existsSync(distEntry)) {
    console.log(`  FAIL ${name}: dist/index.js missing — run pnpm build first`);
    failed = true;
    continue;
  }

  const kb = gzipSizeKb(distEntry);
  const rel = relative(ROOT, packageDir);
  const status = kb <= budget ? 'OK' : 'FAIL';

  console.log(`  ${status} ${name}: ${kb.toFixed(1)}KB gzip / ${budget}KB (${rel})`);

  if (kb > budget) failed = true;
}

if (failed) {
  console.error('\nBundle size budget exceeded.');
  process.exit(1);
}

console.log('\nAll bundle size budgets passed.');
