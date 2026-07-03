import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  createAgentContext,
  type AgentContext,
  type CreateAgentContextOptions,
} from '@gakwaya/integrations-shared';
import type { AppAgentConfig } from '@gakwaya/app-agent';
import type { PanelConfig } from '@gakwaya/ui';

const AgentReactContext = createContext<AgentContext | null>(null);

export interface AppAgentProviderProps extends CreateAgentContextOptions {
  config: AppAgentConfig;
  children: ReactNode;
}

export function AppAgentProvider({
  config,
  children,
  mountPanel = true,
  panelConfig,
}: AppAgentProviderProps) {
  const context = useMemo(() => createAgentContext(config, { mountPanel, panelConfig }), []);

  useEffect(() => () => context.dispose(), [context]);

  return <AgentReactContext.Provider value={context}>{children}</AgentReactContext.Provider>;
}

export function useAppAgent() {
  const context = useContext(AgentReactContext);
  if (!context) {
    throw new Error('useAppAgent must be used within AppAgentProvider');
  }

  const state = useSyncExternalStore(context.subscribe, context.getState, context.getState);

  return {
    agent: context.agent,
    panel: context.panel,
    status: state.status,
    activity: state.activity,
    history: state.history,
    task: state.task,
    execute: (task: string) => context.agent.execute(task),
  };
}

/** Ensures the shared UI panel is mounted via provider context */
export function AppAgentPanel(_props: PanelConfig) {
  useAppAgent();
  return null;
}

export type { AppAgentConfig, PanelConfig };
