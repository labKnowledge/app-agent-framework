/**
 * Core types for App-Agent
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
 * Core agent configuration
 */
export interface AgentConfig {
  // LLM configuration
  /** Base URL for LLM API */
  baseURL: string;
  /** Model identifier */
  model: string;
  /** API key for authentication */
  apiKey?: string;

  // App state integration
  /** Callback to get current application state */
  getAppState: () => Promise<AppState>;

  // Behavior controls
  /** Maximum number of steps before giving up */
  maxSteps?: number;
  /** Delay between steps in milliseconds */
  stepDelay?: number;
  /** Language for agent responses */
  language?: string;

  // Extensibility
  /** Custom tools to register */
  customTools?: Record<string, Tool | null>;
  /** Custom workflows to register */
  customWorkflows?: Record<string, unknown>;

  // Lifecycle hooks
  /** Called before each step */
  onBeforeStep?: (agent: AppAgentCore, step: number) => Promise<void>;
  /** Called after each step */
  onAfterStep?: (agent: AppAgentCore, history: HistoricalEvent[]) => Promise<void>;
  /** Called before task execution */
  onBeforeTask?: (agent: AppAgentCore) => Promise<void>;
  /** Called after task completion */
  onAfterTask?: (agent: AppAgentCore, result: AgentResult) => Promise<void>;
  /** Called when agent is disposed */
  onDispose?: (agent: AppAgentCore) => void;
}

/**
 * Tool interface for agent actions
 */
export interface Tool<TParams = unknown> {
  /** Tool name (unique identifier) */
  name: string;
  /** Tool description for LLM */
  description: string;
  /** Zod schema for input validation */
  inputSchema: z.ZodType<TParams>;
  /** Execute the tool with given parameters */
  execute: (params: TParams, context: ToolContext) => Promise<string>;
}

/**
 * Context provided to tool execution
 */
export interface ToolContext {
  /** Current application state */
  appState: AppState;
  /** DOM state if available */
  domState?: DOMState;
  /** Reference to agent core */
  agent: AppAgentCore;
  /** Abort signal for cancellation */
  signal: AbortSignal;
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
 * Agent status throughout lifecycle
 */
export type AgentStatus =
  | 'idle' // Agent ready, waiting for task
  | 'running' // Agent executing task
  | 'waiting' // Agent waiting for async operation
  | 'error' // Agent encountered error
  | 'completed' // Agent completed task successfully
  | 'disposed'; // Agent cleaned up

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
 * Agent observation from environment
 */
export interface AgentObservation {
  /** Current application state */
  appState: AppState;
  /** Current DOM state */
  domState: DOMState;
  /** Available observations/warnings */
  observations: string[];
  /** Current step number */
  stepNumber: number;
  /** Cumulative wait time */
  totalWaitTime: number;
}

/**
 * Agent reasoning output
 */
export interface AgentReasoning {
  /** Evaluation of previous goal */
  evaluationPreviousGoal: string;
  /** Memory to carry forward */
  memory: string;
  /** Next goal to achieve */
  nextGoal: string;
  /** Action to execute */
  action: Record<string, unknown>;
}

/**
 * Agent action result
 */
export interface AgentActionResult {
  /** Whether action was successful */
  success: boolean;
  /** Result message or data */
  result: string;
  /** Error if action failed */
  error?: Error;
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
 * Agent state (internal)
 */
export interface InternalState {
  /** Total wait time in milliseconds */
  totalWaitTime: number;
  /** Last URL visited */
  lastURL: string;
  /** Current browser state */
  browserState: DOMState | null;
}

/**
 * LLM response
 */
export interface LLMResponse {
  /** Reasoning output */
  reasoning: AgentReasoning;
  /** Raw response data */
  raw: unknown;
}

/**
 * LLM message
 */
export interface LLMMessage {
  /** Message role */
  role: 'system' | 'user' | 'assistant';
  /** Message content */
  content: string;
}

/**
 * LLM client configuration
 */
export interface LLMClientConfig {
  /** Base URL for LLM API */
  baseURL: string;
  /** Model identifier */
  model: string;
  /** API key for authentication */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
}

/**
 * Event types emitted by agent
 */
export type AgentEventType =
  | 'statuschange' // Agent status changed
  | 'historychange' // History updated
  | 'activity' // Transient activity (thinking, acting, etc.)
  | 'dispose'; // Agent disposed

/**
 * Event payload
 */
export type AgentEventPayload =
  | { type: 'statuschange'; status: AgentStatus }
  | { type: 'historychange'; history: HistoricalEvent[] }
  | { type: 'activity'; activity: string }
  | { type: 'dispose' };

/**
 * Event listener
 */
export type AgentEventListener = (payload: AgentEventPayload) => void;
