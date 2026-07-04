/**
 * Shared agent context types (no runtime imports — avoids circular deps with session.ts)
 */

import type { AppAgent } from '@gakwaya/app-agent';
import type { AgentResult, AgentStatus, HistoricalEvent } from '@gakwaya/app-agent-entities';
import type { AppAgentPanel, PanelConfig } from '@gakwaya/app-agent-ui';
import type { ConversationMessage } from './conversation-store';

export interface AgentContextState {
  status: AgentStatus;
  activity: string;
  history: HistoricalEvent[];
  task: string;
  messages: ConversationMessage[];
}

export interface AgentContext {
  agent: AppAgent;
  panel: AppAgentPanel | null;
  conversationStore: import('./conversation-store').ConversationStore | null;
  getState: () => AgentContextState;
  subscribe: (listener: () => void) => () => void;
  execute: (task: string) => Promise<AgentResult>;
  dispose: () => void;
}

export interface CreateAgentContextOptions {
  mountPanel?: boolean;
  panelConfig?: PanelConfig;
  sessionKey?: string;
  persistSession?: boolean;
  storage?: import('@gakwaya/app-agent-entities').StoragePort;
}
