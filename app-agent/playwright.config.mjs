import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'vanilla-demo',
      testMatch: 'vanilla-demo.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5190' },
      webServer: {
        command: 'pnpm dev',
        cwd: './examples/vanilla-demo',
        url: 'http://127.0.0.1:5190',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
    },
    {
      name: 'react-demo',
      testMatch: 'react-demo.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5191' },
      webServer: {
        command: 'pnpm dev',
        cwd: './examples/react-demo',
        url: 'http://127.0.0.1:5191',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
    },
  ],
});
