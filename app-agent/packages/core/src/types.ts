/**
 * Core orchestration types — domain types live in @gakwaya/entities
 */

import type {
  AppState,
  AgentResult,
  AgentStatus,
  HistoricalEvent,
  IAgent,
  AgentTool,
  DOMState,
} from '@gakwaya/entities';

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
} from '@gakwaya/entities';

export { toolSchemas } from '@gakwaya/entities';

/** @deprecated Use AgentTool from @gakwaya/entities */
export type Tool<TParams = unknown> = AgentTool<TParams>;

/** @deprecated Use AgentToolContext from @gakwaya/entities */
export type ToolContext = import('@gakwaya/entities').AgentToolContext;

export type LLMResponse = import('@gakwaya/entities').CoreLLMResponse;

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
  /** Enable tool result caching in the tool registry (default: true) */
  enableToolCaching?: boolean;
  /** Enable multi-agent task routing (default: false) */
  enableMultiAgent?: boolean;
  /** Enable pattern learning from successful tasks (default: false) */
  enableLearning?: boolean;
  learningConfig?: import('@gakwaya/learning').LearningConfig;
  customAgents?: Record<string, import('@gakwaya/multi-agent').SpecializedAgent>;
  memoryConfig?: import('@gakwaya/memory').MemoryManagerConfig;
  customTools?: Record<string, AgentTool | null>;
  customWorkflows?: Record<string, import('@gakwaya/entities').WorkflowDefinition>;
  entitySchemas?: Record<string, import('@gakwaya/entities').EntitySchema>;
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
      diff: import('@gakwaya/state-manager').StateDiff;
      newState: AppState;
      oldState: AppState;
    }
  | { type: 'dispose' };

export type AgentEventListener = (payload: AgentEventPayload) => void;
