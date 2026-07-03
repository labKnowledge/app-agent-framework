/**
 * Simplified workflow definitions for facade configuration
 */

export interface WorkflowDefinition {
  /** Workflow identifier */
  id?: string;
  /** Workflow name */
  name: string;
  /** Description */
  description?: string;
  /** Ordered step identifiers */
  steps: string[] | WorkflowStepDefinition[];
  /** Preconditions */
  preconditions?: string[];
  /** Postconditions */
  postconditions?: string[];
}

export interface WorkflowStepDefinition {
  id: string;
  name: string;
  action?: string;
  toolName?: string;
  parameters?: Record<string, unknown>;
}
