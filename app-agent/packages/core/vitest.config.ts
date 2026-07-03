import { defineConfig } from 'vitest/config';
import path from 'node:path';

const packages = path.resolve(__dirname, '..');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@gakwaya/entities': path.resolve(packages, 'entities/src'),
      '@gakwaya/semantic-registry': path.resolve(packages, 'semantic-registry/src'),
      '@gakwaya/core': path.resolve(__dirname, './src'),
      '@gakwaya/state-manager': path.resolve(packages, 'state-manager/src'),
      '@gakwaya/memory': path.resolve(packages, 'memory/src'),
      '@gakwaya/llm': path.resolve(packages, 'llm/src'),
      '@gakwaya/tools': path.resolve(packages, 'tools/src'),
      '@gakwaya/planner': path.resolve(packages, 'planner/src'),
      '@gakwaya/workflow': path.resolve(packages, 'workflow/src'),
      '@gakwaya/multi-agent': path.resolve(packages, 'multi-agent/src'),
      '@gakwaya/learning': path.resolve(packages, 'learning/src'),
      '@gakwaya/ui': path.resolve(packages, 'ui/src'),
      '@gakwaya/app-agent': path.resolve(packages, 'app-agent/src'),
    },
  },
});
