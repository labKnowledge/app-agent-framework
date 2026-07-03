/**
 * Enhanced LLM Integration Types
 *
 * Advanced LLM client with prompt optimization,
 * streaming support, and cost tracking
 */

/**
 * LLM message role
 */
export type LLMMessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * LLM message
 */
export interface LLMMessage {
  role: LLMMessageRole;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

/**
 * Tool call
 */
export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * LLM response
 */
export interface LLMResponse {
  /** Response message */
  message: LLMMessage;
  /** Model used */
  model: string;
  /** Finish reason */
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'timeout';
  /** Usage statistics */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Response timing */
  timing?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
  /** Cost estimation */
  cost?: number;
}

/**
 * LLM client configuration
 */
export interface LLMClientConfig {
  /** Base URL */
  baseURL: string;
  /** Model identifier */
  model: string;
  /** API key */
  apiKey?: string;
  /** Request timeout */
  timeout?: number;
  /** Maximum retries */
  maxRetries?: number;
  /** Retry delay */
  retryDelay?: number;
  /** Organization ID */
  organizationId?: string;
}

/**
 * Prompt template
 */
export interface PromptTemplate {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template content */
  content: string;
  /** Template variables */
  variables: PromptVariable[];
  /** Template examples */
  examples?: PromptExample[];
}

/**
 * Prompt variable
 */
export interface PromptVariable {
  /** Variable name */
  name: string;
  /** Variable description */
  description?: string;
  /** Default value */
  defaultValue?: string;
  /** Required flag */
  required: boolean;
}

/**
 * Prompt example
 */
export interface PromptExample {
  /** Example input */
  input: Record<string, unknown>;
  /** Example output */
  output: string;
}

/**
 * Prompt optimization options
 */
export interface PromptOptimization {
  /** Enable compression */
  enableCompression?: boolean;
  /** Max tokens */
  maxTokens?: number;
  /** Temperature */
  temperature?: number;
  /** Top P sampling */
  topP?: number;
  /** Frequency penalty */
  frequencyPenalty?: number;
  /** Presence penalty */
  presencePenalty?: number;
  /** Stop sequences */
  stopSequences?: string[];
}

/**
 * Chain of thought configuration
 */
export interface ChainOfThoughtConfig {
  /** Enable CoT */
  enabled: boolean;
  /** CoT style */
  style: 'structured' | 'natural' | 'minimal';
  /** Show intermediate steps */
  showSteps: boolean;
  /** Max reasoning steps */
  maxSteps?: number;
}

/**
 * Few-shot learning configuration
 */
export interface FewShotConfig {
  /** Enable few-shot */
  enabled: boolean;
  /** Number of examples */
  numExamples: number;
  /** Example selection strategy */
  selectionStrategy: 'similarity' | 'random' | 'curated';
  /** Example source */
  examples: PromptExample[];
}

/**
 * Streaming response callback
 */
export type StreamingCallback = (chunk: {
  content: string;
  done: boolean;
  timing?: { startTime: number; currentTime: number };
}) => void;

/**
 * Cost tracking
 */
export interface CostTracking {
  /** Total cost */
  totalCost: number;
  /** Cost by model */
  costByModel: Record<string, number>;
  /** Token usage */
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Request count */
  requestCount: number;
}

/**
 * Context management
 */
export interface ContextManagement {
  /** Max context tokens */
  maxTokens: number;
  /** Context window strategy */
  strategy: 'truncate' | 'compress' | 'summarize';
  /** Priority system */
  priorities: Record<string, number>;
  /** Summarization threshold */
  summarizeThreshold: number;
}

/**
 * LLM client with advanced features
 */
export interface EnhancedLLMClient {
  /** Send completion request */
  complete(messages: LLMMessage[], options?: PromptOptimization): Promise<LLMResponse>;
  /** Stream completion request */
  stream(
    messages: LLMMessage[],
    options?: PromptOptimization,
    onChunk?: StreamingCallback
  ): Promise<LLMResponse>;
  /** Use prompt template */
  useTemplate(templateId: string, variables: Record<string, unknown>): Promise<LLMResponse>;
  /** Get cost tracking */
  getCosts(): CostTracking;
  /** Clear context */
  clearContext(): void;
  /** Set context management */
  setContextManagement(config: ContextManagement): void;
}
