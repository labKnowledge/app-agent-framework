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
      '@gakwaya/entities': path.resolve(packages, 'entities/src'),
      '@gakwaya/core': path.resolve(packages, 'core/src'),
      '@gakwaya/semantic-registry': path.resolve(packages, 'semantic-registry/src'),
      '@gakwaya/workflow': path.resolve(packages, 'workflow/src'),
      '@gakwaya/ui': path.resolve(packages, 'ui/src'),
      '@gakwaya/app-agent': path.resolve(__dirname, './src'),
    },
  },
});
