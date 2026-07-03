/**
 * Shared agent domain types
 */

import type { z } from 'zod';

/**
 * Application state provided by the developer
 */
export interface AppState {
  /** Current view/page identifier */
  currentView: string;
  /** User information and role */
  user: UserInfo;
  /** Additional application context */
  context: Record<string, unknown>;
  /** Timestamp of state capture */
  timestamp: number;
}

/**
 * User information
 */
export interface UserInfo {
  /** Unique user identifier */
  id: string;
  /** User role (affects permissions and available actions) */
  role: string;
  /** Additional user attributes */
  attributes?: Record<string, unknown>;
  /** Authentication status */
  isAuthenticated: boolean;
}

/**
 * Agent status throughout lifecycle
 */
export type AgentStatus =
  | 'idle'
  | 'running'
  | 'waiting'
  | 'error'
  | 'completed'
  | 'disposed';

/**
 * Historical event in agent execution
 */
export interface HistoricalEvent {
  /** Event type */
  type: 'step' | 'observation' | 'reasoning' | 'action' | 'result';
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data: unknown;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Final agent result
 */
export interface AgentResult {
  /** Whether task was completed successfully */
  success: boolean;
  /** Final result message */
  result: string;
  /** Number of steps taken */
  steps: number;
  /** Execution history */
  history: HistoricalEvent[];
  /** Error if task failed */
  error?: Error;
}

/**
 * Minimal agent interface for lifecycle hooks (avoids circular refs)
 */
export interface IAgent {
  readonly task: string;
  readonly taskId: string;
  readonly history: HistoricalEvent[];
  readonly status: AgentStatus;
}

/**
 * DOM state representation
 */
export interface DOMState {
  /** Current URL */
  url: string;
  /** Page title */
  title: string;
  /** Simplified HTML of interactive elements */
  content: string;
  /** Page header with scroll position hint */
  header: string;
  /** Page footer with scroll position hint */
  footer: string;
}

/**
 * Agent observation from environment
 */
export interface AgentObservation {
  appState: AppState;
  domState: DOMState;
  observations: string[];
  stepNumber: number;
  totalWaitTime: number;
}

/**
 * Agent reasoning output
 */
export interface AgentReasoning {
  evaluationPreviousGoal: string;
  memory: string;
  nextGoal: string;
  action: AgentAction;
}

/**
 * Agent action result
 */
export interface AgentActionResult {
  success: boolean;
  result: string;
  error?: Error;
  metadata?: Record<string, unknown>;
}

/**
 * Base tool contract for agent actions
 */
export interface AgentTool<TParams = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TParams>;
  execute: (params: TParams, context: AgentToolContext) => Promise<string>;
}

/**
 * Context provided to tool execution
 */
export interface AgentToolContext {
  appState: AppState;
  domState?: DOMState;
  agent: IAgent;
  signal: AbortSignal;
}

/**
 * LLM message
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM response (core ReAct format)
 */
export interface CoreLLMResponse {
  reasoning: AgentReasoning;
  raw: unknown;
}

/**
 * LLM client configuration
 */
export interface LLMClientConfig {
  baseURL: string;
  model: string;
  apiKey?: string;
  timeout?: number;
  maxRetries?: number;
}

/** Action types */
export type DoneAction = { done: true };
export type WaitAction = { wait: { duration: number } };
export type ClickAction = { click: { index: number } };
export type InputAction = { input: { index: number; text: string } };
export type SelectAction = { select: { index: number; value: string } };
export type ScrollAction = {
  scroll: { direction?: 'up' | 'down' | 'left' | 'right'; amount?: number };
};

export type AgentAction =
  | DoneAction
  | WaitAction
  | ClickAction
  | InputAction
  | SelectAction
  | ScrollAction;
