import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  acquireSession,
  releaseSession,
  createAgentContext,
  type AgentContext,
  type CreateAgentContextOptions,
} from '@gakwaya/app-agent-integrations-shared';
import type { AppAgentConfig } from '@gakwaya/app-agent';
import type { PanelConfig } from '@gakwaya/app-agent-ui';

const AgentReactContext = createContext<AgentContext | null>(null);

export interface AppAgentSessionProviderProps extends CreateAgentContextOptions {
  config: AppAgentConfig;
  children: ReactNode;
  sessionKey?: string;
  persistSession?: boolean;
}

export interface AppAgentProviderProps extends CreateAgentContextOptions {
  config: AppAgentConfig;
  children: ReactNode;
}

export function AppAgentSessionProvider({
  config,
  children,
  sessionKey = 'default',
  persistSession = false,
  mountPanel = true,
  panelConfig,
  storage,
}: AppAgentSessionProviderProps) {
  const configRef = useRef(config);
  configRef.current = config;

  const createContext = () => {
    const liveConfig: AppAgentConfig = {
      ...configRef.current,
      getAppState: () => configRef.current.getAppState(),
      onNavigate: (path) => configRef.current.onNavigate?.(path),
      verifyTaskComplete: (appState, task) =>
        configRef.current.verifyTaskComplete?.(appState, task) ?? false,
    };

    return createAgentContext(liveConfig, {
      mountPanel,
      panelConfig,
      sessionKey,
      persistSession,
      storage,
    });
  };

  const [context] = useState<AgentContext>(() =>
    acquireSession(sessionKey, createContext, { persistSession })
  );

  useEffect(() => {
    return () => {
      releaseSession(sessionKey);
    };
  }, [sessionKey]);

  return <AgentReactContext.Provider value={context}>{children}</AgentReactContext.Provider>;
}

/** @deprecated Use AppAgentSessionProvider — kept as alias with default session */
export function AppAgentProvider({
  config,
  children,
  mountPanel = true,
  panelConfig,
}: AppAgentProviderProps) {
  return (
    <AppAgentSessionProvider
      config={config}
      mountPanel={mountPanel}
      panelConfig={panelConfig}
      sessionKey="default"
      persistSession={false}
    >
      {children}
    </AppAgentSessionProvider>
  );
}

export function useAppAgent() {
  const context = useContext(AgentReactContext);
  if (!context) {
    throw new Error('useAppAgent must be used within AppAgentSessionProvider');
  }

  if (context.agent.status === 'disposed') {
    throw new Error(
      'Agent has been disposed — remount AppAgentSessionProvider or enable persistSession'
    );
  }

  const state = useSyncExternalStore(context.subscribe, context.getState, context.getState);

  return {
    agent: context.agent,
    panel: context.panel,
    conversationStore: context.conversationStore,
    status: state.status,
    activity: state.activity,
    history: state.history,
    messages: state.messages,
    task: state.task,
    execute: (task: string) => context.execute(task),
  };
}

export interface AppAgentShellProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  launcher?: ReactNode;
  children: ReactNode;
  zIndex?: number;
}

/** Route-safe chat shell — mount at app root, outside Routes/Dialog content */
export function AppAgentShell({
  open,
  onOpenChange,
  launcher,
  children,
  zIndex = 1400,
}: AppAgentShellProps) {
  if (typeof document === 'undefined') {
    return null;
  }

  return (
    <>
      {launcher}
      {open
        ? createPortal(
            <div
              className="app-agent-shell"
              style={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex,
                maxHeight: 'min(80vh, 640px)',
                width: 'min(420px, calc(100vw - 32px))',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              {onOpenChange ? (
                <button
                  type="button"
                  aria-label="Close agent"
                  onClick={() => onOpenChange(false)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 18,
                  }}
                >
                  ×
                </button>
              ) : null}
              {children}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

/** Ensures the shared UI panel is mounted via provider context */
export function AppAgentPanel(_props: PanelConfig) {
  useAppAgent();
  return null;
}

export type { AppAgentConfig, PanelConfig };
export {
  routesToNavigation,
  useAppAgentLiveContext,
  discoverPageNavigationFromDOM,
} from './navigation';
export type { RouteNavigationInput, UseAppAgentLiveContextOptions } from './navigation';
