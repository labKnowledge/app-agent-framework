import type { AgentResult, AppState } from '@gakwaya/entities';

export interface AgentContext {
  appState: AppState;
  sharedContext: Map<string, unknown>;
}

export interface AgentDelegate {
  execute(task: string): Promise<AgentResult>;
}

export interface SpecializedAgent {
  name: string;
  description: string;
  capabilities: string[];
  canDelegateTo?: string[];
  execute(task: string, context: AgentContext): Promise<AgentResult>;
}

export interface AgentDefinition {
  name: string;
  description: string;
  capabilities: string[];
  tools: string[];
  canDelegateTo?: string[];
}

export interface AgentRoutingResult {
  agent: SpecializedAgent;
  score: number;
}
