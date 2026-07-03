import {
  defineComponent,
  inject,
  provide,
  onUnmounted,
  shallowRef,
  type InjectionKey,
  type PropType,
  type ShallowRef,
} from 'vue';
import {
  createAgentContext,
  type AgentContext,
  type AgentContextState,
  type CreateAgentContextOptions,
} from '@gakwaya/app-agent-integrations-shared';
import type { AppAgentConfig } from '@gakwaya/app-agent';

const AGENT_CONTEXT_KEY: InjectionKey<AgentContext> = Symbol('app-agent-context');
const AGENT_STATE_KEY: InjectionKey<ShallowRef<AgentContextState>> = Symbol('app-agent-state');

export interface AppAgentPluginOptions extends CreateAgentContextOptions {
  config: AppAgentConfig;
}

function setupAgentContext(options: AppAgentPluginOptions): AgentContext {
  const context = createAgentContext(options.config, {
    mountPanel: options.mountPanel,
    panelConfig: options.panelConfig,
  });

  const state = shallowRef(context.getState());
  context.subscribe(() => {
    state.value = context.getState();
  });

  provide(AGENT_CONTEXT_KEY, context);
  provide(AGENT_STATE_KEY, state);

  onUnmounted(() => context.dispose());

  return context;
}

export const AppAgentProvider = defineComponent({
  name: 'AppAgentProvider',
  props: {
    config: { type: Object as PropType<AppAgentConfig>, required: true },
    mountPanel: { type: Boolean, default: true },
    panelConfig: { type: Object as PropType<CreateAgentContextOptions['panelConfig']> },
  },
  setup(props, { slots }) {
    setupAgentContext({
      config: props.config,
      mountPanel: props.mountPanel,
      panelConfig: props.panelConfig,
    });
    return () => slots.default?.();
  },
});

export const AppAgentPlugin = {
  install(app: { component: (name: string, comp: unknown) => void }) {
    app.component('AppAgentProvider', AppAgentProvider);
    app.component('AppAgentPanel', AppAgentPanel);
  },
};

export function useAppAgent() {
  const context = inject(AGENT_CONTEXT_KEY);
  const state = inject(AGENT_STATE_KEY);

  if (!context || !state) {
    throw new Error('useAppAgent must be used within AppAgentProvider');
  }

  return {
    agent: context.agent,
    panel: context.panel,
    status: () => state.value.status,
    activity: () => state.value.activity,
    history: () => state.value.history,
    task: () => state.value.task,
    execute: (task: string) => context.agent.execute(task),
  };
}

export const AppAgentPanel = defineComponent({
  name: 'AppAgentPanel',
  setup() {
    useAppAgent();
    return () => null;
  },
});

export type { AppAgentConfig };
