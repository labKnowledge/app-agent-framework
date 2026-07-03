import { defineConfig } from 'vitest/config';
import path from 'path';

const packages = path.resolve(__dirname, '..');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@gakwaya/app-agent-entities': path.resolve(packages, 'entities/src'),
      '@gakwaya/app-agent-core': path.resolve(packages, 'core/src'),
      '@gakwaya/app-agent-semantic-registry': path.resolve(packages, 'semantic-registry/src'),
      '@gakwaya/app-agent-workflow': path.resolve(packages, 'workflow/src'),
      '@gakwaya/app-agent-ui': path.resolve(packages, 'ui/src'),
      '@gakwaya/app-agent': path.resolve(__dirname, './src'),
    },
  },
});
