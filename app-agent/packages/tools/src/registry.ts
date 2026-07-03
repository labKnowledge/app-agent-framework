/**
 * Tool Registry
 *
 * Advanced tool management with composition, discovery,
 * and enhanced execution capabilities
 */

import { z } from 'zod';
import EventEmitter from 'eventemitter3';
import type {
  Tool,
  ToolContext,
  ToolResult,
  ToolExecutionRequest,
  ToolDiscoveryQuery,
  ToolDiscoveryResult,
  BatchToolExecution,
  BatchExecutionResult,
  ToolComposition,
  ToolMetrics,
  ToolRegistryConfig,
  ToolCategory,
} from './types';

/**
 * Tool Registry Class
 */
export class ToolRegistry extends EventEmitter {
  private config: Required<ToolRegistryConfig>;
  private tools: Map<string, Tool> = new Map();
  private compositions: Map<string, ToolComposition> = new Map();
  private cache: Map<string, { result: ToolResult; expiresAt: number }> = new Map();
  private metrics: Map<string, ToolMetrics> = new Map();
  private executingTools: Set<string> = new Set();

  constructor(config: ToolRegistryConfig = {}) {
    super();

    this.config = {
      autoDiscover: config.autoDiscover ?? true,
      enableCaching: config.enableCaching ?? true,
      defaultTimeout: config.defaultTimeout ?? 30000,
      enableMetrics: config.enableMetrics ?? true,
      maxCacheSize: config.maxCacheSize ?? 100,
      cacheTTL: config.cacheTTL ?? 300000, // 5 minutes
    };
  }

  /**
   * Register a tool
   */
  registerTool<TParams, TResult>(tool: Tool<TParams, TResult>): void {
    // Validate tool definition
    this.validateTool(tool);

    this.tools.set(tool.id, tool);

    // Initialize metrics
    if (this.config.enableMetrics) {
      this.metrics.set(tool.id, {
        toolId: tool.id,
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        avgDuration: 0,
        cacheHitRate: 0,
        lastExecution: 0,
      });
    }

    this.emit('tool_registered', { tool });
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (tool) {
      this.tools.delete(toolId);
      this.metrics.delete(toolId);
      this.emit('tool_unregistered', { toolId });
    }
  }

  /**
   * Get tool by ID
   */
  getTool(toolId: string): Tool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Get all tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ToolCategory): Tool[] {
    return this.getAllTools().filter(tool => tool.category === category);
  }

  /**
   * Discover tools based on query
   */
  discoverTools(query: ToolDiscoveryQuery): ToolDiscoveryResult {
    const tools = this.getAllTools();
    const results: Tool[] = [];
    const scores: number[] = [];

    for (const tool of tools) {
      const score = this.calculateRelevance(tool, query);
      if (score > 0) {
        results.push(tool);
        scores.push(score);
      }
    }

    // Sort by relevance
    const sorted = results
      .map((tool, i) => ({ tool, score: scores[i] }))
      .sort((a, b) => b.score - a.score);

    return {
      tools: sorted.map(s => s.tool),
      scores: sorted.map(s => s.score),
    };
  }

  /**
   * Execute a tool
   */
  async executeTool<TParams, TResult>(
    toolId: string,
    params: TParams,
    context: ToolContext,
  ): Promise<ToolResult<TResult>> {
    const tool = this.tools.get(toolId) as Tool<TParams, TResult>;
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    // Check if tool is already executing
    if (this.executingTools.has(toolId)) {
      throw new Error(`Tool already executing: ${toolId}`);
    }

    const startTime = Date.now();
    const toolCallId = this.generateId();

    // Update context
    context.execution = {
      executionId: context.execution.executionId || this.generateId(),
      toolCallId,
      timestamp: startTime,
    };

    try {
      this.executingTools.add(toolId);

      // Check cache if enabled
      if (this.config.enableCaching && tool.options?.caching?.enabled) {
        const cached = this.getCachedResult(toolId, params);
        if (cached) {
          this.updateMetrics(toolId, true, Date.now() - startTime, true);
          return cached;
        }
      }

      // Validate parameters
      const validatedParams = tool.inputSchema.parse(params);

      // Execute with timeout
      const result = await this.executeWithTimeout(
        tool,
        validatedParams,
        context,
        tool.options?.timeout ?? this.config.defaultTimeout,
      );

      // Cache result if enabled
      if (this.config.enableCaching && tool.options?.caching?.enabled) {
        this.setCachedResult(toolId, params, result);
      }

      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetrics(toolId, true, Date.now() - startTime, false);
      }

      return {
        success: true,
        data: result,
        metadata: {
          toolId,
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          attempt: 1,
          cached: false,
          status: 'executed',
        },
      };
    } catch (error) {
      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetrics(toolId, false, Date.now() - startTime, false);
      }

      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          cause: error instanceof Error ? error : undefined,
        },
        metadata: {
          toolId,
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          attempt: 1,
          cached: false,
          status: 'failed',
        },
      };
    } finally {
      this.executingTools.delete(toolId);
      this.emit('tool_executed', {
        toolId,
        toolCallId,
        duration: Date.now() - startTime,
      });
    }
  }

  /**
   * Execute batch of tools
   */
  async executeBatch(batch: BatchToolExecution): Promise<BatchExecutionResult> {
    const results: ToolResult[] = [];
    const startTime = Date.now();

    if (batch.mode === 'parallel') {
      // Execute all tools in parallel
      const promises = batch.executions.map(exec =>
        this.executeTool(exec.toolId, exec.parameters, this.createContext(exec)),
      );

      const parallelResults = await Promise.allSettled(promises);

      for (const result of parallelResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: {
              code: 'BATCH_ERROR',
              message: result.reason.message,
            },
            metadata: {
              toolId: 'unknown',
              startTime,
              endTime: Date.now(),
              duration: Date.now() - startTime,
              attempt: 1,
              cached: false,
              status: 'failed',
            },
          });
        }
      }
    } else {
      // Execute sequentially
      for (const exec of batch.executions) {
        try {
          const result = await this.executeTool(exec.toolId, exec.parameters, this.createContext(exec));
          results.push(result);

          // Stop on error if configured
          if (batch.errorHandling === 'stop' && !result.success) {
            break;
          }
        } catch (error) {
          results.push({
            success: false,
            error: {
              code: 'BATCH_ERROR',
              message: error instanceof Error ? error.message : String(error),
            },
            metadata: {
              toolId: exec.toolId,
              startTime,
              endTime: Date.now(),
              duration: Date.now() - startTime,
              attempt: 1,
              cached: false,
              status: 'failed',
            },
          });

          if (batch.errorHandling === 'stop') {
            break;
          }
        }
      }
    }

    // Calculate summary
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      cached: results.filter(r => r.metadata?.cached).length,
      totalDuration: Date.now() - startTime,
    };

    return {
      batchId: batch.batchId,
      results,
      summary,
    };
  }

  /**
   * Register tool composition
   */
  registerComposition(composition: ToolComposition): void {
    this.compositions.set(composition.id, composition);
    this.emit('composition_registered', { composition });
  }

  /**
   * Execute tool composition
   */
  async executeComposition(
    compositionId: string,
    parameters: Record<string, unknown>,
    context: ToolContext,
  ): Promise<ToolResult[]> {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    const results: ToolResult[] = [];

    switch (composition.strategy) {
      case 'sequential':
        for (const composedTool of composition.tools) {
          const toolParams = this.mapParameters(composedTool, parameters);
          const result = await this.executeTool(composedTool.toolId, toolParams, context);
          results.push(result);

          if (!result.success && composition.errorHandling === 'stop') {
            break;
          }
        }
        break;

      case 'parallel':
        const promises = composition.tools.map(composedTool => {
          const toolParams = this.mapParameters(composedTool, parameters);
          return this.executeTool(composedTool.toolId, toolParams, context);
        });

        const parallelResults = await Promise.allSettled(promises);
        for (const result of parallelResults) {
          results.push(result.status === 'fulfilled' ? result.value : {
            success: false,
            error: { code: 'COMPOSITION_ERROR', message: 'Parallel execution failed' },
          });
        }
        break;

      default:
        throw new Error(`Unsupported composition strategy: ${composition.strategy}`);
    }

    return results;
  }

  /**
   * Get tool metrics
   */
  getMetrics(toolId?: string): ToolMetrics | Map<string, ToolMetrics> {
    if (toolId) {
      return this.metrics.get(toolId) ?? this.createEmptyMetrics(toolId);
    }

    return new Map(this.metrics);
  }

  /**
   * Clear tool cache
   */
  clearCache(toolId?: string): void {
    if (toolId) {
      // Clear specific tool cache
      for (const [key, value] of this.cache) {
        if (key.startsWith(`${toolId}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  /**
   * Dispose of registry
   */
  dispose(): void {
    this.tools.clear();
    this.compositions.clear();
    this.cache.clear();
    this.metrics.clear();
    this.removeAllListeners();
  }

  /**
   * Private methods
   */

  private validateTool(tool: Tool): void {
    if (!tool.id || !tool.name) {
      throw new Error('Tool must have id and name');
    }

    if (!tool.description) {
      throw new Error('Tool must have description');
    }

    if (!tool.inputSchema) {
      throw new Error('Tool must have input schema');
    }

    if (!tool.execute || typeof tool.execute !== 'function') {
      throw new Error('Tool must have execute function');
    }
  }

  private calculateRelevance(tool: Tool, query: ToolDiscoveryQuery): number {
    let score = 0;

    // Search terms matching
    if (query.terms && query.terms.length > 0) {
      const searchText = `${tool.name} ${tool.description}`.toLowerCase();
      const termMatches = query.terms.filter(term =>
        searchText.includes(term.toLowerCase())
      ).length;

      score += (termMatches / query.terms.length) * 0.5;
    }

    // Category matching
    if (query.categories && query.categories.includes(tool.category)) {
      score += 0.3;
    }

    // Capabilities matching
    if (query.capabilities) {
      const capabilityMatches = query.capabilities.filter(cap =>
        tool.metadata.capabilities.includes(cap)
      ).length;

      score += (capabilityMatches / query.capabilities.length) * 0.2;
    }

    // Tags matching
    if (query.tags) {
      const tagMatches = query.tags.filter(tag =>
        tool.metadata.tags.includes(tag)
      ).length;

      score += (tagMatches / query.tags.length) * 0.1;
    }

    // Risk level filtering
    if (query.maxRiskLevel) {
      const riskLevels = { low: 1, medium: 2, high: 3 };
      if (riskLevels[tool.metadata.riskLevel] > riskLevels[query.maxRiskLevel]) {
        return 0;
      }
    }

    return Math.min(score, 1.0);
  }

  private async executeWithTimeout<TParams, TResult>(
    tool: Tool<TParams, TResult>,
    params: TParams,
    context: ToolContext,
    timeout: number,
  ): Promise<TResult> {
    return Promise.race([
      tool.execute(params, context),
      new Promise<TResult>((_, reject) =>
        setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
      ),
    ]);
  }

  private getCachedResult<TParams, TResult>(
    toolId: string,
    params: TParams,
  ): ToolResult<TResult> | null {
    const cacheKey = this.getCacheKey(toolId, params);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.result as ToolResult<TResult>;
    }

    return null;
  }

  private setCachedResult<TParams, TResult>(
    toolId: string,
    params: TParams,
    result: ToolResult<TResult>,
  ): void {
    const cacheKey = this.getCacheKey(toolId, params);

    // Enforce cache size limit
    if (this.cache.size >= this.config.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      result,
      expiresAt: Date.now() + this.config.cacheTTL,
    });
  }

  private getCacheKey(toolId: string, params: unknown): string {
    const paramsStr = JSON.stringify(params);
    return `${toolId}:${this.hashString(paramsStr)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private updateMetrics(
    toolId: string,
    success: boolean,
    duration: number,
    cached: boolean,
  ): void {
    if (!this.config.enableMetrics) {
      return;
    }

    let metrics = this.metrics.get(toolId);
    if (!metrics) {
      metrics = this.createEmptyMetrics(toolId);
      this.metrics.set(toolId, metrics);
    }

    metrics.totalCalls++;
    metrics.lastExecution = Date.now();

    if (success) {
      metrics.successfulCalls++;
    } else {
      metrics.failedCalls++;
    }

    // Update average duration
    const totalDuration = metrics.avgDuration * (metrics.totalCalls - 1) + duration;
    metrics.avgDuration = totalDuration / metrics.totalCalls;

    // Update cache hit rate
    if (cached) {
      const cacheHits = metrics.cacheHitRate * (metrics.totalCalls - 1) + 1;
      metrics.cacheHitRate = cacheHits / metrics.totalCalls;
    }
  }

  private createEmptyMetrics(toolId: string): ToolMetrics {
    return {
      toolId,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      avgDuration: 0,
      cacheHitRate: 0,
      lastExecution: 0,
    };
  }

  private createContext(execution: ToolExecutionRequest): ToolContext {
    return {
      appState: {},
      execution: {
        executionId: this.generateId(),
        toolCallId: this.generateId(),
        timestamp: Date.now(),
      },
      signal: new AbortController().signal,
      contextData: new Map(),
    };
  }

  private mapParameters(
    composedTool: { toolId: string; parameters: Record<string, unknown>; parameterMapping?: Record<string, string> },
    inputParameters: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!composedTool.parameterMapping) {
      return composedTool.parameters;
    }

    const mapped: Record<string, unknown> = {};

    for (const [targetKey, sourceKey] of Object.entries(composedTool.parameterMapping)) {
      if (sourceKey.startsWith('$') && sourceKey.substring(1) in inputParameters) {
        mapped[targetKey] = inputParameters[sourceKey.substring(1)];
      } else {
        mapped[targetKey] = composedTool.parameters[sourceKey] ?? inputParameters[sourceKey];
      }
    }

    return mapped;
  }

  private generateId(): string {
    return `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
