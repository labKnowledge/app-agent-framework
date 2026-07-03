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
      '@app-agent/entities': path.resolve(packages, 'entities/src'),
      '@app-agent/core': path.resolve(packages, 'core/src'),
      '@app-agent/semantic-registry': path.resolve(packages, 'semantic-registry/src'),
      '@app-agent/workflow': path.resolve(packages, 'workflow/src'),
      '@app-agent/ui': path.resolve(packages, 'ui/src'),
      '@app-agent/app-agent': path.resolve(__dirname, './src'),
    },
  },
});
