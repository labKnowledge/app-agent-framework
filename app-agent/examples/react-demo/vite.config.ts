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
      '@gakwaya/entities': resolve(packages, 'entities/src'),
      '@gakwaya/core': resolve(packages, 'core/src'),
      '@gakwaya/app-agent': resolve(packages, 'app-agent/src'),
      '@gakwaya/ui': resolve(packages, 'ui/src'),
      '@gakwaya/integrations-react': resolve(packages, 'integrations/react/src'),
      '@gakwaya/integrations-shared': resolve(packages, 'integrations/shared/src'),
      '@gakwaya/multi-agent': resolve(packages, 'multi-agent/src'),
      '@gakwaya/learning': resolve(packages, 'learning/src'),
      '@gakwaya/llm': resolve(packages, 'llm/src'),
      '@gakwaya/tools': resolve(packages, 'tools/src'),
      '@gakwaya/planner': resolve(packages, 'planner/src'),
      '@gakwaya/workflow': resolve(packages, 'workflow/src'),
      '@gakwaya/semantic-registry': resolve(packages, 'semantic-registry/src'),
      '@gakwaya/state-manager': resolve(packages, 'state-manager/src'),
      '@gakwaya/memory': resolve(packages, 'memory/src'),
    },
  },
});
