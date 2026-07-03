#!/usr/bin/env node
/**
 * Rename @gakwaya/* workspace packages to @gakwaya/app-agent-* prefixed names.
 * Order matters: longest / most specific names first. @gakwaya/app-agent (facade) is unchanged.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Old → new; longest names first to avoid partial replacements */
const RENAMES: [string, string][] = [
  ['@gakwaya/integrations-shared', '@gakwaya/app-agent-integrations-shared'],
  ['@gakwaya/integrations-react', '@gakwaya/app-agent-react'],
  ['@gakwaya/integrations-vue', '@gakwaya/app-agent-vue'],
  ['@gakwaya/integrations-svelte', '@gakwaya/app-agent-svelte'],
  ['@gakwaya/semantic-registry', '@gakwaya/app-agent-semantic-registry'],
  ['@gakwaya/state-manager', '@gakwaya/app-agent-state-manager'],
  ['@gakwaya/multi-agent', '@gakwaya/app-agent-multi-agent'],
  ['@gakwaya/entities', '@gakwaya/app-agent-entities'],
  ['@gakwaya/learning', '@gakwaya/app-agent-learning'],
  ['@gakwaya/workflow', '@gakwaya/app-agent-workflow'],
  ['@gakwaya/planner', '@gakwaya/app-agent-planner'],
  ['@gakwaya/memory', '@gakwaya/app-agent-memory'],
  ['@gakwaya/tools', '@gakwaya/app-agent-tools'],
  ['@gakwaya/core', '@gakwaya/app-agent-core'],
  ['@gakwaya/llm', '@gakwaya/app-agent-llm'],
  ['@gakwaya/ui', '@gakwaya/app-agent-ui'],
];

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
    if (name.endsWith('CHANGELOG.md')) continue;
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
  const full = join(ROOT, name);
  if (existsSync(full)) files.push(full);
}

function applyRenames(text: string): string {
  let out = text;
  for (const [from, to] of RENAMES) {
    out = out.split(from).join(to);
  }
  return out;
}

let changed = 0;
for (const file of files) {
  if (file.endsWith('rename-scope.ts')) continue;
  const text = readFileSync(file, 'utf8');
  const next = applyRenames(text);
  if (next === text) continue;
  writeFileSync(file, next);
  changed++;
}

console.log(`Updated ${changed} files with ${RENAMES.length} package renames.`);
