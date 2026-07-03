import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('architecture fitness', () => {
  it('passes dependency-cruiser layer rules', () => {
    expect(() => {
      execSync('pnpm arch:check', {
        cwd: rootDir,
        stdio: 'pipe',
      });
    }).not.toThrow();
  });
});
