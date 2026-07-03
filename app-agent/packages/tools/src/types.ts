/**
 * Advanced Tool System Types
 *
 * Enhanced tool management with composition, discovery,
 * and advanced execution capabilities
 */

import type { z } from 'zod';

/**
 * Enhanced tool definition
 */
export interface Tool<TParams = unknown, TResult = unknown> {
  /** Unique tool identifier */
  id: string;
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Tool category */
  category: ToolCategory;
  /** Input schema for validation */
  inputSchema: z.ZodType<TParams>;
  /** Output schema for validation */
  outputSchema?: z.ZodType<TResult>;
  /** Execute function */
  execute: ToolExecutor<TParams, TResult>;
  /** Tool metadata */
  metadata: ToolMetadata;
  /** Execution options */
  options?: ToolOptions;
}

/**
 * Tool executor function
 */
export type ToolExecutor<TParams = unknown, TResult = unknown> =
  (params: TParams, context: ToolContext) => Promise<TResult>;

/**
 * Tool categories
 */
export type ToolCategory =
  | 'navigation'      // Page/view navigation
  | 'interaction'     // Element interaction
  | 'extraction'      // Information extraction
  | 'manipulation'    // Data manipulation
  | 'verification'    // Result verification
  | 'utility'        // Helper utilities
  | 'composite';     // Composed of other tools

/**
 * Tool metadata
 */
export interface ToolMetadata {
  /** Author */
  author?: string;
  /** Version */
  version?: string;
  /** Tags for discovery */
  tags: string[];
  /** Examples of usage */
  examples: ToolExample[];
  /** Related tools */
  relatedTools?: string[];
  /** Tool capabilities */
  capabilities: string[];
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Tool example
 */
export interface ToolExample {
  description: string;
  parameters: Record<string, unknown>;
  result?: unknown;
}

/**
 * Tool options
 */
export interface ToolOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Result caching */
  caching?: CachingConfig;
  /** Rate limiting */
  rateLimit?: RateLimitConfig;
  /** Permission requirements */
  permissions?: string[];
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  retryDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

/**
 * Caching configuration
 */
export interface CachingConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxCalls: number;
  perMilliseconds: number;
}

/**
 * Tool context
 */
export interface ToolContext {
  /** Application state */
  appState: Record<string, unknown>;
  /** DOM state if available */
  domState?: Record<string, unknown>;
  /** Agent reference */
  agent?: any;
  /** Execution metadata */
  execution: {
    executionId: string;
    toolCallId: string;
    timestamp: number;
  };
  /** Abort signal */
  signal: AbortSignal;
  /** Additional context */
  contextData?: Map<string, unknown>;
}

/**
 * Tool result
 */
export interface ToolResult<TResult = unknown> {
  /** Success flag */
  success: boolean;
  /** Result data */
  data?: TResult;
  /** Error if failed */
  error?: ToolError;
  /** Execution metadata */
  metadata: ToolExecutionMetadata;
}

/**
 * Tool error
 */
export interface ToolError {
  code: string;
  message: string;
  details?: unknown;
  cause?: Error;
}

/**
 * Tool execution metadata
 */
export interface ToolExecutionMetadata {
  /** Tool ID */
  toolId: string;
  /** Execution start time */
  startTime: number;
  /** Execution end time */
  endTime: number;
  /** Duration in milliseconds */
  duration: number;
  /** Attempt number */
  attempt: number;
  /** Cached result */
  cached: boolean;
  /** Execution status */
  status: 'executed' | 'cached' | 'timeout' | 'cancelled' | 'failed';
}

/**
 * Tool composition definition
 */
export interface ToolComposition {
  /** Composition ID */
  id: string;
  /** Composition name */
  name: string;
  /** Composition description */
  description: string;
  /** Composed tools */
  tools: ComposedTool[];
  /** Composition strategy */
  strategy: CompositionStrategy;
  /** Error handling */
  errorHandling: CompositionErrorHandling;
}

/**
 * Composed tool reference
 */
export interface ComposedTool {
  /** Tool ID */
  toolId: string;
  /** Tool parameters */
  parameters: Record<string, unknown>;
  /** Parameter mapping */
  parameterMapping?: Record<string, string>;
}

/**
 * Composition strategy
 */
export type CompositionStrategy =
  | 'sequential'     // Execute tools one after another
  | 'parallel'        // Execute tools simultaneously
  | 'conditional'    // Execute based on conditions
  | 'pipeline';       // Pipe output to next input

/**
 * Composition error handling
 */
export type CompositionErrorHandling =
  | 'stop'           // Stop on first error
  | 'continue'       // Continue with remaining tools
  | 'rollback'       // Rollback completed tools
  | 'retry';         // Retry failed tool

/**
 * Tool discovery query
 */
export interface ToolDiscoveryQuery {
  /** Search terms */
  terms?: string[];
  /** Categories to filter */
  categories?: ToolCategory[];
  /** Capabilities filter */
  capabilities?: string[];
  /** Tags filter */
  tags?: string[];
  /** Risk level filter */
  maxRiskLevel?: 'low' | 'medium' | 'high';
}

/**
 * Tool discovery result
 */
export interface ToolDiscoveryResult {
  /** Matching tools */
  tools: Tool[];
  /** Relevance scores */
  scores: number[];
}

/**
 * Batch tool execution
 */
export interface BatchToolExecution {
  /** Batch ID */
  batchId: string;
  /** Tool executions */
  executions: ToolExecutionRequest[];
  /** Execution mode */
  mode: 'sequential' | 'parallel';
  /** Error handling */
  errorHandling: 'stop' | 'continue' | 'collect';
}

/**
 * Tool execution request
 */
export interface ToolExecutionRequest {
  /** Tool ID */
  toolId: string;
  /** Parameters */
  parameters: Record<string, unknown>;
  /** Execution options override */
  options?: ToolOptions;
}

/**
 * Batch execution result
 */
export interface BatchExecutionResult {
  /** Batch ID */
  batchId: string;
  /** Individual results */
  results: ToolResult[];
  /** Summary statistics */
  summary: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
    totalDuration: number;
  };
}

/**
 * Tool registry configuration
 */
export interface ToolRegistryConfig {
  /** Auto-discover tools */
  autoDiscover?: boolean;
  /** Enable result caching */
  enableCaching?: boolean;
  /** Default timeout */
  defaultTimeout?: number;
  /** Enable metrics */
  enableMetrics?: boolean;
  /** Maximum cache size */
  maxCacheSize?: number;
  /** Cache TTL */
  cacheTTL?: number;
}

/**
 * Tool metrics
 */
export interface ToolMetrics {
  /** Tool ID */
  toolId: string;
  /** Total calls */
  totalCalls: number;
  /** Successful calls */
  successfulCalls: number;
  ** Failed calls */
  failedCalls: number;
  /** Average duration */
  avgDuration: number;
  /** Cache hit rate */
  cacheHitRate: number;
  /** Last execution time */
  lastExecution: number;
}
