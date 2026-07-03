/**
 * Task Planner Types
 *
 * Intelligent task planning and decomposition system
 */

/**
 * Plan status
 */
export type PlanStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';

/**
 * Task plan with hierarchical structure
 */
export interface TaskPlan {
  /** Plan ID */
  id: string;
  /** Original user request */
  originalRequest: string;
  /** Plan status */
  status: PlanStatus;
  /** High-level goal */
  goal: string;
  /** Sub-tasks */
  tasks: PlannedTask[];
  /** Dependencies between tasks */
  dependencies: TaskDependency[];
  /** Estimated total duration */
  estimatedDuration: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last updated timestamp */
  updatedAt: number;
  /** Execution context */
  context: PlanContext;
}

/**
 * Individual planned task
 */
export interface PlannedTask {
  /** Task ID */
  id: string;
  /** Parent task ID (if sub-task) */
  parentId?: string;
  /** Task description */
  description: string;
  /** Task status */
  status: PlanStatus;
  /** Task type */
  type: TaskType;
  /** Required capabilities */
  capabilities: string[];
  /** Estimated duration (ms) */
  estimatedDuration: number;
  /** Priority (0-1) */
  priority: number;
  /** Task parameters */
  parameters?: Record<string, unknown>;
  /** Success criteria */
  successCriteria: string[];
  /** Failure conditions */
  failureConditions: string[];
  /** Retry configuration */
  retryConfig?: RetryConfig;
  /** Sub-tasks */
  subTasks?: PlannedTask[];
}

/**
 * Task types
 */
export type TaskType =
  | 'observation'      // Observe environment/state
  | 'navigation'       // Navigate to location/view
  | 'interaction'      // Interact with elements
  | 'extraction'       // Extract information
  | 'verification'     // Verify results
  | 'decision'         // Make decision
  | 'compound';        // Compound task with sub-tasks

/**
 * Task dependency
 */
export interface TaskDependency {
  /** From task ID */
  from: string;
  /** To task ID */
  to: string;
  /** Dependency type */
  type: 'sequential' | 'parallel' | 'conditional';
  /** Condition (for conditional dependencies) */
  condition?: string;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Retry delay (ms) */
  retryDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
}

/**
 * Plan context
 */
export interface PlanContext {
  /** Application state */
  appState: Record<string, unknown>;
  /** Available tools */
  availableTools: string[];
  /** User constraints */
  constraints: PlanConstraint[];
  /** User preferences */
  preferences: PlanPreferences;
}

/**
 * Plan constraint
 */
export interface PlanConstraint {
  /** Constraint type */
  type: 'time' | 'resource' | 'permission' | 'custom';
  /** Constraint description */
  description: string;
  /** Constraint value */
  value: unknown;
}

/**
 * Plan preferences
 */
export interface PlanPreferences {
  /** Preferred execution speed */
  speed: 'fast' | 'normal' | 'thorough';
  /** Risk tolerance */
  riskTolerance: 'low' | 'medium' | 'high';
  /** Verification level */
  verification: 'minimal' | 'normal' | 'extensive';
}

/**
 * Planning result
 */
export interface PlanningResult {
  /** Generated plan */
  plan: TaskPlan;
  /** Confidence in plan (0-1) */
  confidence: number;
  /** Alternative plans */
  alternatives: TaskPlan[];
  /** Reasoning for plan */
  reasoning: string;
}

/**
 * Execution state
 */
export interface ExecutionState {
  /** Current task ID */
  currentTaskId: string | null;
  /** Completed tasks */
  completedTasks: string[];
  /** Failed tasks */
  failedTasks: string[];
  /** Blocked tasks */
  blockedTasks: string[];
  /** Execution progress (0-1) */
  progress: number;
  /** Current phase */
  phase: ExecutionPhase;
}

/**
 * Execution phase
 */
export type ExecutionPhase =
  | 'planning'
  | 'execution'
  | 'verification'
  | 'recovery'
  | 'completion';

/**
 * Planner configuration
 */
export interface PlannerConfig {
  maxDepth?: number;
  maxSubTasks?: number;
  planningTimeout?: number;
  enableReplanning?: boolean;
  maxReplanningAttempts?: number;
  useFewShot?: boolean;
  strategy?: 'hierarchical' | 'linear' | 'adaptive';
}

/**
 * Replanning trigger
 */
export interface ReplanningTrigger {
  /** Trigger type */
  type: 'failure' | 'block' | 'change' | 'optimization';
  /** Trigger reason */
  reason: string;
  /** Trigger timestamp */
  timestamp: number;
  /** Task that triggered replanning */
  taskId?: string;
}
