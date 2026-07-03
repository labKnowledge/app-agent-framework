/**
 * Public facade configuration
 */

import type { AppState, EntitySchema, WorkflowDefinition } from '@gakwaya/app-agent-entities';
import type { AgentConfig } from '@gakwaya/app-agent-core';

export interface AppAgentConfig extends Omit<AgentConfig, 'entitySchemas' | 'customWorkflows'> {
  /** Entity schema definitions keyed by type */
  entities?: Record<string, EntitySchema>;
  /** Workflow definitions keyed by id */
  workflows?: Record<string, WorkflowDefinition>;
}

export type { AppState, EntitySchema, WorkflowDefinition };
