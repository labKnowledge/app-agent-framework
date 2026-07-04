import { defineConfig } from 'vitest/config';
import path from 'node:path';

const packages = path.resolve(__dirname, '../..');

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@gakwaya/app-agent-integrations-shared': path.resolve(
        __dirname,
        '../shared/src/index.ts'
      ),
      '@gakwaya/app-agent-entities': path.resolve(packages, 'entities/src'),
      '@gakwaya/app-agent-core': path.resolve(packages, 'core/src'),
      '@gakwaya/app-agent-semantic-registry': path.resolve(packages, 'semantic-registry/src'),
      '@gakwaya/app-agent-state-manager': path.resolve(packages, 'state-manager/src'),
      '@gakwaya/app-agent-memory': path.resolve(packages, 'memory/src'),
      '@gakwaya/app-agent-llm': path.resolve(packages, 'llm/src'),
      '@gakwaya/app-agent-tools': path.resolve(packages, 'tools/src'),
      '@gakwaya/app-agent-planner': path.resolve(packages, 'planner/src'),
      '@gakwaya/app-agent-workflow': path.resolve(packages, 'workflow/src'),
      '@gakwaya/app-agent-multi-agent': path.resolve(packages, 'multi-agent/src'),
      '@gakwaya/app-agent-learning': path.resolve(packages, 'learning/src'),
      '@gakwaya/app-agent-ui': path.resolve(packages, 'ui/src'),
      '@gakwaya/app-agent': path.resolve(packages, 'app-agent/src'),
    },
  },
});
