#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FROM = '@gakwaya/';
const TO = '@gakwaya/';
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);
const EXT = /\.(ts|tsx|json|md|mjs|cjs|svelte|html|yaml|yml)$/;

function walk(dir: string, files: string[]): void {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (name === 'pnpm-lock.yaml') continue;
    if (EXT.test(name)) files.push(full);
  }
}

const files: string[] = [];
for (const entry of ['packages', 'examples', 'scripts', 'e2e', 'docs', '.github']) {
  const dir = join(ROOT, entry);
  try {
    walk(dir, files);
  } catch {
    /* optional dir */
  }
}
for (const name of [
  'package.json',
  'tsconfig.base.json',
  'tsconfig.json',
  'vitest.config.ts',
  'playwright.config.mjs',
  'architecture.config.json',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'PROGRESS.md',
  'README.md',
  '.changeset/config.json',
]) {
  files.push(join(ROOT, name));
}

let changed = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (!text.includes(FROM)) continue;
  writeFileSync(file, text.split(FROM).join(TO));
  changed++;
}

console.log(`Updated ${changed} files: ${FROM} -> ${TO}`);
