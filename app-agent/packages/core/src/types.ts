/**
 * Core orchestration types — domain types live in @app-agent/entities
 */

import type {
  AppState,
  AgentResult,
  AgentStatus,
  HistoricalEvent,
  IAgent,
  AgentTool,
  DOMState,
} from '@app-agent/entities';

export type {
  AppState,
  UserInfo,
  AgentResult,
  AgentStatus,
  HistoricalEvent,
  IAgent,
  AgentTool,
  AgentToolContext,
  DOMState,
  AgentObservation,
  AgentReasoning,
  AgentActionResult,
  AgentAction,
  LLMMessage,
  LLMClientConfig,
  DoneAction,
  WaitAction,
  ClickAction,
  InputAction,
  SelectAction,
  ScrollAction,
} from '@app-agent/entities';

export { toolSchemas } from '@app-agent/entities';

/** @deprecated Use AgentTool from @app-agent/entities */
export type Tool<TParams = unknown> = AgentTool<TParams>;

/** @deprecated Use AgentToolContext from @app-agent/entities */
export type ToolContext = import('@app-agent/entities').AgentToolContext;

export type LLMResponse = import('@app-agent/entities').CoreLLMResponse;

/**
 * Core agent configuration
 */
export interface AgentConfig {
  baseURL: string;
  model: string;
  apiKey?: string;
  getAppState: () => Promise<AppState>;
  maxSteps?: number;
  stepDelay?: number;
  language?: string;
  trackState?: boolean;
  enableMemory?: boolean;
  enablePlanning?: boolean;
  memoryConfig?: import('@app-agent/memory').MemoryManagerConfig;
  customTools?: Record<string, AgentTool | null>;
  customWorkflows?: Record<string, import('@app-agent/entities').WorkflowDefinition>;
  entitySchemas?: Record<string, import('@app-agent/entities').EntitySchema>;
  onBeforeStep?: (agent: IAgent, step: number) => Promise<void>;
  onAfterStep?: (agent: IAgent, history: HistoricalEvent[]) => Promise<void>;
  onBeforeTask?: (agent: IAgent) => Promise<void>;
  onAfterTask?: (agent: IAgent, result: AgentResult) => Promise<void>;
  onDispose?: (agent: IAgent) => void;
}

/**
 * Internal agent state
 */
export interface InternalState {
  totalWaitTime: number;
  lastURL: string;
  browserState: DOMState | null;
}

/**
 * Event types emitted by agent
 */
export type AgentEventType =
  'statuschange' | 'historychange' | 'activity' | 'statechange' | 'dispose';

/**
 * Event payload
 */
export type AgentEventPayload =
  | { type: 'statuschange'; status: AgentStatus }
  | { type: 'historychange'; history: HistoricalEvent[] }
  | { type: 'activity'; activity: string }
  | {
      type: 'statechange';
      diff: import('@app-agent/state-manager').StateDiff;
      newState: AppState;
      oldState: AppState;
    }
  | { type: 'dispose' };

export type AgentEventListener = (payload: AgentEventPayload) => void;
