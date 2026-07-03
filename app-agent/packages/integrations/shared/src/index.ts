/**
 * Shared agent context for framework integrations
 */

import { AppAgent } from '@app-agent/app-agent';
import { AppAgentPanel } from '@app-agent/ui';
import type { AppAgentConfig } from '@app-agent/app-agent';
import type { AgentStatus, HistoricalEvent } from '@app-agent/entities';
import type { PanelConfig } from '@app-agent/ui';

export interface AgentContextState {
  status: AgentStatus;
  activity: string;
  history: HistoricalEvent[];
  task: string;
}

export interface AgentContext {
  agent: AppAgent;
  panel: AppAgentPanel | null;
  getState: () => AgentContextState;
  subscribe: (listener: () => void) => () => void;
  dispose: () => void;
}

export interface CreateAgentContextOptions {
  mountPanel?: boolean;
  panelConfig?: PanelConfig;
}

export function createAgentContext(
  config: AppAgentConfig,
  options: CreateAgentContextOptions = {}
): AgentContext {
  const agent = new AppAgent(config);
  let panel: AppAgentPanel | null = null;
  const state: AgentContextState = {
    status: 'idle',
    activity: '',
    history: [],
    task: '',
  };
  const listeners = new Set<() => void>();

  const notify = (): void => {
    listeners.forEach((listener) => listener());
  };

  agent.on('statuschange', ({ status }) => {
    state.status = status;
    panel?.setStatus(status);
    notify();
  });

  agent.on('activity', ({ activity }) => {
    state.activity = activity;
    panel?.setActivity(activity);
    notify();
  });

  agent.on('historychange', ({ history }) => {
    state.history = history;
    const last = history[history.length - 1];
    if (last) panel?.addHistoryItem(last);
    notify();
  });

  if (options.mountPanel !== false && typeof document !== 'undefined') {
    panel = new AppAgentPanel(options.panelConfig);
    panel.onSubmit((task) => {
      void agent.execute(task);
    });
  }

  return {
    agent,
    panel,
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => {
      panel?.dispose();
      agent.dispose();
      listeners.clear();
    },
  };
}
