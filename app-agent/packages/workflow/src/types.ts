/**
 * Workflow Engine Types
 *
 * Complex workflow orchestration with state management,
 * parallel execution, and error recovery
 */

/**
 * Workflow status
 */
export type WorkflowStatus =
  'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'waiting';

/**
 * Workflow definition
 */
export interface Workflow {
  /** Unique workflow identifier */
  id: string;
  /** Workflow name */
  name: string;
  /** Workflow description */
  description: string;
  /** Workflow version */
  version: string;
  /** Workflow steps */
  steps: WorkflowStep[];
  /** Workflow variables */
  variables: WorkflowVariable[];
  /** Error handling strategy */
  errorStrategy: ErrorStrategy;
  /** Execution options */
  options: WorkflowOptions;
  /** Metadata */
  metadata: WorkflowMetadata;
}

/**
 * Workflow step
 */
export interface WorkflowStep {
  /** Step identifier */
  id: string;
  /** Step name */
  name: string;
  /** Step type */
  type: StepType;
  /** Step action to execute */
  action: StepAction;
  /** Input mapping */
  inputMapping?: Record<string, string>;
  /** Output mapping */
  outputMapping?: Record<string, string>;
  /** Conditions for execution */
  conditions?: StepCondition[];
  /** Error handling */
  onError?: ErrorHandling;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Timeout (ms) */
  timeout?: number;
  /** Dependencies (step IDs that must complete first) */
  dependencies?: string[];
  /** Parallel execution allowed */
  allowParallel?: boolean;
}

/**
 * Step types
 */
export type StepType =
  | 'action' // Execute single action
  | 'sequence' // Execute steps sequentially
  | 'parallel' // Execute steps in parallel
  | 'branch' // Conditional branching
  | 'loop' // Iterative execution
  | 'wait' // Wait for condition/time
  | 'trigger' // Trigger event/callback
  | 'subtask' // Execute sub-workflow
  | 'compensation'; // Compensation transaction

/**
 * Step action
 */
export type StepAction =
  ToolAction | WorkflowAction | ConditionalAction | LoopAction | WaitAction | TriggerAction;

/**
 * Tool action
 */
export interface ToolAction {
  type: 'tool';
  toolName: string;
  parameters: Record<string, unknown>;
}

/**
 * Workflow action
 */
export interface WorkflowAction {
  type: 'workflow';
  workflowId: string;
  parameters: Record<string, unknown>;
}

/**
 * Conditional action
 */
export interface ConditionalAction {
  type: 'conditional';
  branches: ConditionalBranch[];
  default?: StepAction;
}

/**
 * Conditional branch
 */
export interface ConditionalBranch {
  condition: string;
  action: StepAction;
}

/**
 * Loop action
 */
export interface LoopAction {
  type: 'loop';
  iterations: number | 'until';
  condition?: string;
  loopVariable?: string;
  body: StepAction;
}

/**
 * Wait action
 */
export interface WaitAction {
  type: 'wait';
  duration?: number;
  condition?: string;
  pollInterval?: number;
}

/**
 * Trigger action
 */
export interface TriggerAction {
  type: 'trigger';
  eventType: string;
  payload?: Record<string, unknown>;
}

/**
 * Step condition
 */
export interface StepCondition {
  expression: string;
  operator: 'equals' | 'notEquals' | 'greater' | 'less' | 'contains' | 'exists';
  value?: unknown;
}

/**
 * Workflow variable
 */
export interface WorkflowVariable {
  /** Variable name */
  name: string;
  /** Variable type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** Default value */
  defaultValue?: unknown;
  /** Required flag */
  required: boolean;
  /** Description */
  description?: string;
}

/**
 * Error strategy
 */
export type ErrorStrategy =
  | 'stop' // Stop workflow on error
  | 'continue' // Continue to next step
  | 'retry' // Retry failed step
  | 'compensate'; // Run compensation

/**
 * Error handling
 */
export interface ErrorHandling {
  strategy: ErrorStrategy;
  fallbackStep?: string;
  compensationSteps?: string[];
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay?: number;
}

/**
 * Workflow options
 */
export interface WorkflowOptions {
  /** Maximum execution time (ms) */
  timeout?: number;
  /** Enable persistence */
  enablePersistence?: boolean;
  /** Enable checkpoints */
  enableCheckpoints?: boolean;
  /** Checkpoint interval (ms) */
  checkpointInterval?: number;
  /** Enable parallel execution */
  enableParallel?: boolean;
  /** Maximum parallel steps */
  maxParallelSteps?: number;
}

/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
  /** Author */
  author?: string;
  /** Creation date */
  createdAt?: number;
  /** Last modified */
  updatedAt?: number;
  /** Tags */
  tags?: string[];
  /** Category */
  category?: string;
}

/**
 * Workflow execution state
 */
export interface WorkflowExecution {
  /** Execution ID */
  id: string;
  /** Workflow ID */
  workflowId: string;
  /** Execution status */
  status: WorkflowStatus;
  /** Current step index */
  currentStepIndex: number;
  /** Completed steps */
  completedSteps: string[];
  /** Failed steps */
  failedSteps: FailedStep[];
  /** Step results */
  stepResults: Map<string, StepResult>;
  /** Variable values */
  variables: Record<string, unknown>;
  /** Execution start time */
  startedAt: number;
  /** Execution end time */
  endedAt?: number;
  /** Error information */
  error?: ExecutionError;
  /** Checkpoint data */
  checkpoints: Checkpoint[];
}

/**
 * Failed step information
 */
export interface FailedStep {
  stepId: string;
  error: Error;
  timestamp: number;
  retryCount: number;
}

/**
 * Step result
 */
export interface StepResult {
  stepId: string;
  success: boolean;
  result?: unknown;
  error?: Error;
  duration: number;
  timestamp: number;
}

/**
 * Execution error
 */
export interface ExecutionError {
  message: string;
  stepId?: string;
  code?: string;
  details?: unknown;
}

/**
 * Checkpoint data
 */
export interface Checkpoint {
  checkpointId: string;
  timestamp: number;
  stepIndex: number;
  variables: Record<string, unknown>;
  stepResults: Map<string, StepResult>;
}

/**
 * Workflow template
 */
export interface WorkflowTemplate {
  templateId: string;
  name: string;
  description: string;
  category: string;
  parameters: TemplateParameter[];
  workflow: Omit<Workflow, 'id' | 'metadata'>;
}

/**
 * Template parameter
 */
export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: unknown;
  description?: string;
}

/**
 * Workflow event
 */
export interface WorkflowEvent {
  eventType:
    | 'started'
    | 'completed'
    | 'failed'
    | 'paused'
    | 'resumed'
    | 'step_started'
    | 'step_completed'
    | 'step_failed'
    | 'checkpoint';
  executionId: string;
  timestamp: number;
  data?: unknown;
}

/**
 * Workflow engine configuration
 */
export interface WorkflowEngineConfig {
  /** Maximum concurrent workflows */
  maxConcurrentWorkflows?: number;
  /** Default timeout (ms) */
  defaultTimeout?: number;
  /** Enable persistence */
  enablePersistence?: boolean;
  /** Persistence key */
  persistenceKey?: string;
  /** Injectable storage port */
  storage?: import('@gakwaya/entities').StoragePort;
  /** Checkpoint interval (ms) */
  checkpointInterval?: number;
  /** Enable metrics */
  enableMetrics?: boolean;
}
