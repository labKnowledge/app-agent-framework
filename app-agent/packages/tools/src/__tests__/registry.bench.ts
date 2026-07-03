import { bench, describe } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../registry';
import type { Tool, ToolContext } from '../types';

function createBenchTool(id: string, execute: Tool['execute']): Tool {
  return {
    id,
    name: id,
    description: 'benchmark tool',
    category: 'utility',
    inputSchema: z.object({ value: z.string() }),
    execute,
    metadata: {
      tags: [],
      examples: [],
      capabilities: [],
      riskLevel: 'low',
    },
    options: {
      caching: { enabled: true, ttl: 60_000, maxSize: 100 },
    },
  };
}

const context: ToolContext = {
  appState: {},
  domState: {},
  agent: {},
  execution: { executionId: 'bench', toolCallId: 'call', timestamp: Date.now() },
};

describe('ToolRegistry performance', () => {
  bench(
    'cache miss',
    async () => {
      const registry = new ToolRegistry({ enableCaching: true });
      const tool = createBenchTool('miss', async (params) => params.value);
      registry.registerTool(tool);
      await registry.executeTool(tool.id, { value: `${Math.random()}` }, context);
    },
    { time: 500 }
  );

  bench(
    'cache hit',
    async () => {
      const registry = new ToolRegistry({ enableCaching: true });
      const tool = createBenchTool('hit', async (params) => params.value);
      registry.registerTool(tool);
      const params = { value: 'stable' };
      await registry.executeTool(tool.id, params, context);
      await registry.executeTool(tool.id, params, context);
    },
    { time: 500 }
  );
});
