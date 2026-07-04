/**
 * Core orchestration types — domain types live in @gakwaya/app-agent-entities
 */

import type {
  AppState,
  AgentResult,
  AgentStatus,
  HistoricalEvent,
  IAgent,
  AgentTool,
  DOMState,
} from '@gakwaya/app-agent-entities';

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
  AgentActivity,
  AgentStepEvent,
  ObservationEvent,
  UserTakeoverEvent,
  RetryEvent,
  AgentErrorEvent,
} from '@gakwaya/app-agent-entities';

export { toolSchemas } from '@gakwaya/app-agent-entities';

/** @deprecated Use AgentTool from @gakwaya/app-agent-entities */
export type Tool<TParams = unknown> = AgentTool<TParams>;

/** @deprecated Use AgentToolContext from @gakwaya/app-agent-entities */
export type ToolContext = import('@gakwaya/app-agent-entities').AgentToolContext;

export type LLMResponse = import('@gakwaya/app-agent-entities').CoreLLMResponse;

/** assistant = answer first, navigate only on explicit intent (default); agent = action-first (legacy) */
export type BehaviorMode = 'assistant' | 'agent';

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
  learningConfig?: import('@gakwaya/app-agent-learning').LearningConfig;
  customAgents?: Record<string, import('@gakwaya/app-agent-multi-agent').SpecializedAgent>;
  memoryConfig?: import('@gakwaya/app-agent-memory').MemoryManagerConfig;
  customTools?: Record<string, AgentTool | null>;
  customWorkflows?: Record<string, import('@gakwaya/app-agent-entities').WorkflowDefinition>;
  entitySchemas?: Record<string, import('@gakwaya/app-agent-entities').EntitySchema>;

  /**
   * Lifecycle hooks for task execution.
   *
   * All hooks receive the agent instance as first parameter.
   * All hooks are optional - only implement the ones you need.
   */

  /**
   * Called before each step execution.
   * Useful for: logging, state checks, step-level setup
   */
  onBeforeStep?: (agent: IAgent, step: number) => Promise<void> | void;

  /**
   * Called after each step execution.
   * Useful for: progress tracking, step-level cleanup
   */
  onAfterStep?: (agent: IAgent, history: HistoricalEvent[]) => Promise<void> | void;

  /**
   * Called before task execution starts.
   * Useful for: task-level setup, validation, resource allocation
   */
  onBeforeTask?: (agent: IAgent) => Promise<void> | void;

  /**
   * Called after task execution completes (success or failure).
   * Useful for: cleanup, result processing, notifications
   */
  onAfterTask?: (agent: IAgent, result: AgentResult) => Promise<void> | void;

  /**
   * Called when an error occurs during execution.
   * Useful for: error logging, custom error handling, recovery attempts
   */
  onError?: (agent: IAgent, error: Error) => Promise<void> | void;

  /**
   * Called when the agent is disposed.
   * Useful for: cleanup, resource release, saving state
   */
  onDispose?: (agent: IAgent) => void;
  /** SPA navigation callback — prefer over window.location.assign */
  onNavigate?: (path: string) => Promise<void> | void;
  /** Delay after navigate for client routers to settle (default 400) */
  postNavigateDelayMs?: number;
  /** Max indexed DOM elements in LLM prompt (default 30) */
  maxDomElementsInPrompt?: number;
  /** When true, prefer registered customTools over DOM clicks in prompts */
  preferApplicationTools?: boolean;
  /** Verify task completion from app state instead of LLM done action */
  verifyTaskComplete?: (appState: AppState, task: string) => boolean | Promise<boolean>;
  /** Minimum pattern success rate to replay without ReAct (default 0.8) */
  learningReplayThreshold?: number;
  /** Registered app routes for validated navigation */
  navigation?: import('@gakwaya/app-agent-entities').NavigationDestination[];
  /** Registered app capabilities (settings, mutations, queries) */
  capabilities?: import('@gakwaya/app-agent-entities').AppCapability[];
  /** Reject navigate to unregistered paths (default true when navigation is set) */
  strictNavigation?: boolean;
  /** interactive = per-step activity; quiet = working… then result only */
  executionMode?: 'interactive' | 'quiet';
  /** Optional progress callback (especially for quiet mode) */
  onTaskProgress?: (summary: {
    step: number;
    maxSteps?: number;
    activity: string;
    phase: 'start' | 'step' | 'complete' | 'error';
  }) => void;
  /**
   * Scan DOM landmarks for nav links (header, sidebar, hamburger, footer).
   * Default true in browser — surfaces hidden menu links without expanding them.
   */
  discoverPageNavigation?: boolean;
  /** Max discovered nav links in prompt (default 32) */
  maxPageNavLinks?: number;
  /**
   * assistant = answer questions from app state first; navigate only on explicit go/open/navigate intent (default)
   * agent = action-first routing with fuzzy navigation matching (legacy)
   */
  behaviorMode?: BehaviorMode;
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
      diff: import('@gakwaya/app-agent-state-manager').StateDiff;
      newState: AppState;
      oldState: AppState;
    }
  | { type: 'dispose' };

export type AgentEventListener = (payload: AgentEventPayload) => void;

/**
 * Agent reflection state - the reflection-before-action model
 *
 * Every tool call must first reflect on:
 * - evaluation_previous_goal: How well did the previous action achieve its goal?
 * - memory: Key information to remember for future steps
 * - next_goal: What should be accomplished in the next action?
 */
export interface AgentReflection {
  evaluation_previous_goal: string;
  memory: string;
  next_goal: string;
}

/**
 * MacroTool input structure
 *
 * This is the core abstraction that enforces the "reflection-before-action" mental model.
 * Before executing any action, the LLM must output its reasoning state.
 */
export interface MacroToolInput extends Partial<AgentReflection> {
  action: Record<string, unknown>;
}

/**
 * MacroTool output structure
 */
export interface MacroToolResult {
  input: MacroToolInput;
  output: string;
}
