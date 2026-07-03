import { getContext, setContext, onDestroy } from 'svelte';
import { writable, type Readable } from 'svelte/store';
import {
  createAgentContext,
  type AgentContext,
  type AgentContextState,
  type CreateAgentContextOptions,
} from '@gakwaya/integrations-shared';
import type { AppAgentConfig } from '@gakwaya/app-agent';

const AGENT_CONTEXT_KEY = Symbol('app-agent-context');

export interface AppAgentStore extends Readable<AgentContextState> {
  agent: AgentContext['agent'];
  panel: AgentContext['panel'];
  execute: (task: string) => ReturnType<AgentContext['agent']['execute']>;
  dispose: () => void;
}

export function createAppAgentStore(
  config: AppAgentConfig,
  options: CreateAgentContextOptions = {}
): AppAgentStore {
  const context = createAgentContext(config, options);
  const store = writable(context.getState());

  context.subscribe(() => {
    store.set(context.getState());
  });

  return {
    subscribe: store.subscribe,
    agent: context.agent,
    panel: context.panel,
    execute: (task: string) => context.agent.execute(task),
    dispose: () => context.dispose(),
  };
}

export function setAppAgentContext(
  config: AppAgentConfig,
  options: CreateAgentContextOptions = {}
): AppAgentStore {
  const agentStore = createAppAgentStore(config, options);
  setContext(AGENT_CONTEXT_KEY, agentStore);
  onDestroy(() => agentStore.dispose());
  return agentStore;
}

export function getAppAgentContext(): AppAgentStore {
  const store = getContext<AppAgentStore>(AGENT_CONTEXT_KEY);
  if (!store) {
    throw new Error('App agent context not found. Call setAppAgentContext in a parent layout.');
  }
  return store;
}

export type { AppAgentConfig };
