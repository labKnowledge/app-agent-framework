#!/usr/bin/env node
/**
 * Updates publishable package.json files with dist exports and npm metadata.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES_DIR = join(ROOT, 'packages');

const REPO = {
  type: 'git' as const,
  url: 'https://github.com/labKnowledge/app-agent-framework.git',
};
const HOMEPAGE = 'https://github.com/labKnowledge/app-agent-framework/tree/main/app-agent';
const BUGS = 'https://github.com/labKnowledge/app-agent-framework/issues';

function findPackageDirs(dir: string): string[] {
  const dirs: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry === 'integrations') {
      for (const sub of readdirSync(full)) {
        const subPath = join(full, sub);
        if (existsSync(join(subPath, 'package.json'))) dirs.push(subPath);
      }
      continue;
    }
    if (existsSync(join(full, 'package.json'))) dirs.push(full);
  }
  return dirs;
}

function updatePackage(packageDir: string): void {
  const pkgPath = join(packageDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>;
  const relDir = packageDir.replace(`${ROOT}/`, '');

  pkg.main = './dist/index.js';
  pkg.types = './dist/index.d.ts';
  pkg.files = ['dist', 'README.md'];
  pkg.repository = { ...REPO, directory: `app-agent/${relDir}` };
  pkg.homepage = HOMEPAGE;
  pkg.bugs = { url: BUGS };
  pkg.publishConfig = { access: 'public' };
  pkg.license = pkg.license ?? 'MIT';

  const exports: Record<string, { types: string; import: string }> = {
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.js',
    },
  };

  if (pkg.name === '@app-agent/ui' && existsSync(join(packageDir, 'src/style.css'))) {
    exports['./style.css'] = {
      types: './dist/style.css',
      import: './dist/style.css',
    };
  }

  if (pkg.name === '@app-agent/integrations-svelte') {
    exports['./AppAgentPanel.svelte'] = {
      types: './dist/AppAgentPanel.svelte',
      import: './dist/AppAgentPanel.svelte',
    };
  }

  pkg.exports = exports;

  const scripts = (pkg.scripts ?? {}) as Record<string, string>;
  scripts.build = scripts.build ?? 'vite build';
  scripts.prepublishOnly = 'pnpm build';
  scripts.clean = scripts.clean ?? 'rm -rf dist';
  pkg.scripts = scripts;

  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`Updated ${pkg.name}`);
}

for (const dir of findPackageDirs(PACKAGES_DIR)) {
  updatePackage(dir);
}

console.log('Done.');
