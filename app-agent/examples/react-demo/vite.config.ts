import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const packages = resolve(__dirname, '../../packages');

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5191,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@gakwaya/app-agent-entities': resolve(packages, 'entities/src'),
      '@gakwaya/app-agent-core': resolve(packages, 'core/src'),
      '@gakwaya/app-agent': resolve(packages, 'app-agent/src'),
      '@gakwaya/app-agent-ui': resolve(packages, 'ui/src'),
      '@gakwaya/app-agent-react': resolve(packages, 'integrations/react/src'),
      '@gakwaya/app-agent-integrations-shared': resolve(packages, 'integrations/shared/src'),
      '@gakwaya/app-agent-multi-agent': resolve(packages, 'multi-agent/src'),
      '@gakwaya/app-agent-learning': resolve(packages, 'learning/src'),
      '@gakwaya/app-agent-llm': resolve(packages, 'llm/src'),
      '@gakwaya/app-agent-tools': resolve(packages, 'tools/src'),
      '@gakwaya/app-agent-planner': resolve(packages, 'planner/src'),
      '@gakwaya/app-agent-workflow': resolve(packages, 'workflow/src'),
      '@gakwaya/app-agent-semantic-registry': resolve(packages, 'semantic-registry/src'),
      '@gakwaya/app-agent-state-manager': resolve(packages, 'state-manager/src'),
      '@gakwaya/app-agent-memory': resolve(packages, 'memory/src'),
    },
  },
});
