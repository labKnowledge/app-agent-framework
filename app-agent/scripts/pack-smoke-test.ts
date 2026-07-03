#!/usr/bin/env node
/**
 * Smoke test: pack @gakwaya/app-agent and verify dist artifacts are included.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_DIR = join(ROOT, 'packages/app-agent');

function run(cmd: string, cwd: string): string {
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

console.log('Building packages...');
run('pnpm build', ROOT);

console.log('Packing @gakwaya/app-agent...');
const packLines = run('pnpm pack --pack-destination /tmp/app-agent-pack', PKG_DIR)
  .trim()
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);
const tarballPath =
  [...packLines].reverse().find((line) => line.endsWith('.tgz')) ??
  join('/tmp/app-agent-pack', packLines[packLines.length - 1] ?? '');

if (!existsSync(tarballPath)) {
  console.error(`Tarball not found: ${tarballPath}`);
  process.exit(1);
}

const listing = run(`tar -tzf "${tarballPath}"`, ROOT);
const FORBIDDEN_IN_TARBALL = [
  'package/src/',
  'package/__tests__/',
  'package/examples/',
  'package/e2e/',
  'package/vite.config',
  'package/vitest.config',
  'package/tsconfig',
];

for (const pattern of FORBIDDEN_IN_TARBALL) {
  if (listing.split('\n').some((line) => line.includes(pattern))) {
    console.error(`Tarball must not include dev files: ${pattern}`);
    process.exit(1);
  }
}

const required = ['package/dist/index.js', 'package/dist/index.d.ts', 'package/package.json'];

for (const file of required) {
  if (!listing.includes(file)) {
    console.error(`Missing in tarball: ${file}`);
    process.exit(1);
  }
}

const pkgInTar = JSON.parse(
  run(`tar -xOf "${tarballPath}" package/package.json`, ROOT)
) as { main: string; exports: Record<string, { import: string }> };

if (pkgInTar.main !== './dist/index.js') {
  console.error(`Unexpected main field: ${pkgInTar.main}`);
  process.exit(1);
}

if (pkgInTar.exports['.'].import !== './dist/index.js') {
  console.error('Unexpected exports mapping for "."');
  process.exit(1);
}

console.log('Pack smoke test passed.');
