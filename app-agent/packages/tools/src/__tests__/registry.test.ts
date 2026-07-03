import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../registry';
import type { Tool, ToolContext } from '../types';

function createMockTool(overrides: Partial<Tool> = {}): Tool {
  const execute = vi.fn(async (params: { value: string }) => `result:${params.value}`);
  return {
    id: 'test-tool',
    name: 'test',
    description: 'Test tool',
    category: 'utility',
    inputSchema: z.object({ value: z.string() }),
    execute,
    metadata: {
      tags: ['test'],
      examples: [],
      capabilities: ['test'],
      riskLevel: 'low',
    },
    options: {
      caching: { enabled: true, ttl: 60000, maxSize: 10 },
    },
    ...overrides,
  };
}

function createContext(): ToolContext {
  return {
    appState: {},
    domState: {},
    agent: {},
    execution: {
      executionId: 'exec-1',
      toolCallId: 'call-1',
      timestamp: Date.now(),
    },
  };
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry({ enableCaching: true, enableMetrics: true });
  });

  it('registers and retrieves tools by name', () => {
    const tool = createMockTool();
    registry.registerTool(tool);

    expect(registry.getToolByName('test')).toBe(tool);
    expect(registry.getAllTools()).toHaveLength(1);
  });

  it('returns cached result on second execution', async () => {
    const tool = createMockTool();
    registry.registerTool(tool);
    const context = createContext();
    const params = { value: 'hello' };

    const first = await registry.executeTool(tool.id, params, context);
    const second = await registry.executeTool(tool.id, params, context);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(second.metadata?.cached).toBe(true);
    expect(tool.execute).toHaveBeenCalledTimes(1);
  });

  it('misses cache when caching is disabled', async () => {
    registry = new ToolRegistry({ enableCaching: false });
    const tool = createMockTool();
    registry.registerTool(tool);
    const context = createContext();
    const params = { value: 'hello' };

    await registry.executeTool(tool.id, params, context);
    await registry.executeTool(tool.id, params, context);

    expect(tool.execute).toHaveBeenCalledTimes(2);
  });

  it('tracks execution metrics', async () => {
    const tool = createMockTool({ options: { caching: { enabled: false, ttl: 0, maxSize: 0 } } });
    registry.registerTool(tool);
    const context = createContext();

    await registry.executeTool(tool.id, { value: 'a' }, context);

    const metrics = registry.getMetrics(tool.id);
    expect(metrics.totalCalls).toBe(1);
    expect(metrics.successfulCalls).toBe(1);
    expect(metrics.avgDuration).toBeGreaterThanOrEqual(0);
  });

  it('executes batch tools in parallel', async () => {
    const toolA = createMockTool({ id: 'tool-a', name: 'toolA' });
    const toolB = createMockTool({ id: 'tool-b', name: 'toolB' });
    registry.registerTool(toolA);
    registry.registerTool(toolB);
    const context = createContext();

    const result = await registry.executeBatch({
      mode: 'parallel',
      executions: [
        { toolId: 'tool-a', parameters: { value: '1' }, context },
        { toolId: 'tool-b', parameters: { value: '2' }, context },
      ],
    });

    expect(result.results).toHaveLength(2);
    expect(result.results.every((r) => r.success)).toBe(true);
  });

  it('clears cache for a specific tool', async () => {
    const tool = createMockTool();
    registry.registerTool(tool);
    const context = createContext();
    const params = { value: 'cached' };

    await registry.executeTool(tool.id, params, context);
    registry.clearCache(tool.id);
    await registry.executeTool(tool.id, params, context);

    expect(tool.execute).toHaveBeenCalledTimes(2);
  });
});
