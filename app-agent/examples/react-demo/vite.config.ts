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
      '@app-agent/entities': resolve(packages, 'entities/src'),
      '@app-agent/core': resolve(packages, 'core/src'),
      '@app-agent/app-agent': resolve(packages, 'app-agent/src'),
      '@app-agent/ui': resolve(packages, 'ui/src'),
      '@app-agent/integrations-react': resolve(packages, 'integrations/react/src'),
      '@app-agent/integrations-shared': resolve(packages, 'integrations/shared/src'),
      '@app-agent/multi-agent': resolve(packages, 'multi-agent/src'),
      '@app-agent/learning': resolve(packages, 'learning/src'),
      '@app-agent/llm': resolve(packages, 'llm/src'),
      '@app-agent/tools': resolve(packages, 'tools/src'),
      '@app-agent/planner': resolve(packages, 'planner/src'),
      '@app-agent/workflow': resolve(packages, 'workflow/src'),
      '@app-agent/semantic-registry': resolve(packages, 'semantic-registry/src'),
      '@app-agent/state-manager': resolve(packages, 'state-manager/src'),
      '@app-agent/memory': resolve(packages, 'memory/src'),
    },
  },
});
