import { defineConfig } from 'vitest/config';
import path from 'path';

const packages = path.resolve(__dirname, '..');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@app-agent/entities': path.resolve(packages, 'entities/src'),
      '@app-agent/semantic-registry': path.resolve(packages, 'semantic-registry/src'),
      '@app-agent/core': path.resolve(__dirname, './src'),
      '@app-agent/state-manager': path.resolve(packages, 'state-manager/src'),
      '@app-agent/memory': path.resolve(packages, 'memory/src'),
      '@app-agent/llm': path.resolve(packages, 'llm/src'),
      '@app-agent/tools': path.resolve(packages, 'tools/src'),
      '@app-agent/planner': path.resolve(packages, 'planner/src'),
      '@app-agent/workflow': path.resolve(packages, 'workflow/src'),
      '@app-agent/ui': path.resolve(packages, 'ui/src'),
      '@app-agent/app-agent': path.resolve(packages, 'app-agent/src'),
    },
  },
});
