import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./packages/core/src/__tests__/setup.ts'],
    include: ['packages/**/src/**/*.test.ts', 'packages/**/src/**/*.test.tsx', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/**/src/**/*.ts', 'packages/**/src/**/*.tsx'],
      exclude: ['**/__tests__/**', '**/*.bench.ts', '**/*.test.ts', '**/*.test.tsx'],
    },
  },
});
