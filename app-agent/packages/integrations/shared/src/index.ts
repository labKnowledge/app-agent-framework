/**
 * Shared agent context for framework integrations
 */

import { AppAgent } from '@gakwaya/app-agent';
import { AppAgentPanel } from '@gakwaya/app-agent-ui';
import type { AppAgentConfig } from '@gakwaya/app-agent';
import type { AgentResult, StoragePort } from '@gakwaya/app-agent-entities';
import { LocalStorageAdapter } from '@gakwaya/app-agent-entities';
import { ConversationStore } from './conversation-store';
import type { AgentContext, AgentContextState, CreateAgentContextOptions } from './context-types';

export type { AgentContext, AgentContextState, CreateAgentContextOptions } from './context-types';

function buildPersistedConfig(
  config: AppAgentConfig,
  sessionKey: string,
  persistSession: boolean,
  storage?: StoragePort
): AppAgentConfig {
  if (!persistSession) {
    return config;
  }

  const resolvedStorage = storage ?? new LocalStorageAdapter();

  return {
    ...config,
    enableMemory: config.enableMemory ?? true,
    enableLearning: config.enableLearning ?? true,
    memoryConfig: {
      ...config.memoryConfig,
      enablePersistence: true,
      persistenceKey: config.memoryConfig?.persistenceKey ?? `app-agent:memory:${sessionKey}`,
      storage: config.memoryConfig?.storage ?? resolvedStorage,
    },
    learningConfig: {
      ...config.learningConfig,
      storage: config.learningConfig?.storage ?? 'indexedDB',
    },
  };
}

export function createAgentContext(
  config: AppAgentConfig,
  options: CreateAgentContextOptions = {}
): AgentContext {
  const sessionKey = options.sessionKey ?? 'default';
  const persistSession = options.persistSession ?? false;
  const resolvedConfig = buildPersistedConfig(config, sessionKey, persistSession, options.storage);

  const agent = new AppAgent(resolvedConfig);
  let panel: AppAgentPanel | null = null;
  const conversationStore =
    persistSession && typeof window !== 'undefined'
      ? new ConversationStore({
          sessionKey,
          storage: options.storage ?? new LocalStorageAdapter(),
        })
      : null;

  const state: AgentContextState = {
    status: 'idle',
    activity: '',
    history: [],
    task: '',
    messages: [],
  };
  const listeners = new Set<() => void>();

  const notify = (): void => {
    listeners.forEach((listener) => listener());
  };

  if (conversationStore) {
    void conversationStore.load().then(() => {
      state.messages = conversationStore.getMessages();
      notify();
    });
  }

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
      void executeTask(task);
    });
  }

  async function executeTask(task: string): Promise<AgentResult> {
    state.task = task;
    notify();

    if (conversationStore) {
      await conversationStore.append({ role: 'user', content: task });
      state.messages = conversationStore.getMessages();
      notify();
    }

    if (typeof window !== 'undefined' && conversationStore) {
      await conversationStore.setLastRoute(window.location.pathname);
    }

    const result = await agent.execute(task);

    if (conversationStore) {
      await conversationStore.append({
        role: 'assistant',
        content: result.success
          ? String(result.result)
          : (result.error?.message ?? String(result.result)),
        taskId: agent.taskId,
      });
      state.messages = conversationStore.getMessages();
    }

    state.task = '';
    notify();
    return result;
  }

  return {
    agent,
    panel,
    conversationStore,
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    execute: executeTask,
    dispose: () => {
      panel?.dispose();
      agent.dispose();
      listeners.clear();
    },
  };
}

export { acquireSession, releaseSession, getSession, resetAllSessions } from './session';
export type { SessionOptions } from './session';
export { ConversationStore } from './conversation-store';
export type { ConversationMessage, SessionSnapshot } from './conversation-store';
