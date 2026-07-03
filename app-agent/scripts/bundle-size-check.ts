#!/usr/bin/env node
/**
 * Bundle size budget check for app-agent packages.
 * Measures TypeScript source size as a proxy until full Rollup builds are wired.
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES_DIR = join(ROOT, 'packages');

/** Generous initial budget in KB (source); tighten as builds stabilize */
const BUDGETS_KB: Record<string, number> = {
  '@app-agent/entities': 80,
  '@app-agent/core': 200,
  '@app-agent/tools': 120,
  '@app-agent/llm': 80,
  '@app-agent/app-agent': 250,
  '@app-agent/ui': 100,
};

function collectSourceBytes(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name === 'dist') {
        continue;
      }
      total += collectSourceBytes(full);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      total += statSync(full).size;
    }
  }
  return total;
}

function getPackageName(packageDir: string): string {
  const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
  return pkg.name as string;
}

let failed = false;

console.log('Bundle size check (source KB budgets):\n');

for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const packageDir = join(PACKAGES_DIR, entry.name);
  const packageJsonPath = join(packageDir, 'package.json');
  try {
    readFileSync(packageJsonPath);
  } catch {
    continue;
  }

  const name = getPackageName(packageDir);
  const budget = BUDGETS_KB[name];

  if (!budget) continue;

  const bytes = collectSourceBytes(join(packageDir, 'src'));
  const kb = bytes / 1024;
  const rel = relative(ROOT, packageDir);
  const status = kb <= budget ? 'OK' : 'FAIL';

  console.log(`  ${status} ${name}: ${kb.toFixed(1)}KB / ${budget}KB (${rel})`);

  if (kb > budget) {
    failed = true;
  }
}

if (failed) {
  console.error('\nBundle size budget exceeded.');
  process.exit(1);
}

console.log('\nAll bundle size budgets passed.');
