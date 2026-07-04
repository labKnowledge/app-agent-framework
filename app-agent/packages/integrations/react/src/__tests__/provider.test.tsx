/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React, { StrictMode } from 'react';
import { AppAgentSessionProvider, useAppAgent } from '../index';
import { resetAllSessions } from '@gakwaya/app-agent-integrations-shared';

vi.mock('@gakwaya/app-agent-llm', () => ({
  EnhancedLLMClient: class {
    async invokeReAct() {
      return {
        reasoning: {
          evaluation_previous_goal: 'Starting',
          memory: 'Done',
          next_goal: 'Finish',
          action: { done: true },
        },
      };
    }
  },
}));

const agentConfig = {
  baseURL: 'https://api.example.com',
  model: 'test-model',
  maxSteps: 3,
  getAppState: async () => ({
    currentView: 'shop',
    user: { id: '1', role: 'user', isAuthenticated: true },
    context: {},
    timestamp: Date.now(),
  }),
};

function StatusView() {
  const { status, execute } = useAppAgent();
  const [steps, setSteps] = React.useState(0);

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="steps">{steps}</span>
      <button
        onClick={async () => {
          const result = await execute('What page am I on?');
          setSteps(result.steps);
        }}
      >
        Run
      </button>
    </div>
  );
}

describe('integrations-react', () => {
  afterEach(() => {
    resetAllSessions();
    document.body.innerHTML = '';
  });

  it('provides agent context to children', () => {
    render(
      <AppAgentSessionProvider config={agentConfig} mountPanel={false}>
        <StatusView />
      </AppAgentSessionProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });

  it('executes task under StrictMode without disposed status', async () => {
    render(
      <StrictMode>
        <AppAgentSessionProvider config={agentConfig} mountPanel={false}>
          <StatusView />
        </AppAgentSessionProvider>
      </StrictMode>
    );

    await act(async () => {
      screen.getByRole('button', { name: 'Run' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).not.toHaveTextContent('disposed');
    });

    await waitFor(() => {
      expect(Number(screen.getByTestId('steps').textContent)).toBeGreaterThan(0);
    });
  });

  it('survives provider unmount and remount', async () => {
    const { unmount } = render(
      <AppAgentSessionProvider config={agentConfig} mountPanel={false}>
        <StatusView />
      </AppAgentSessionProvider>
    );

    unmount();

    render(
      <AppAgentSessionProvider config={agentConfig} mountPanel={false}>
        <StatusView />
      </AppAgentSessionProvider>
    );

    await act(async () => {
      screen.getByRole('button', { name: 'Run' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).not.toHaveTextContent('disposed');
    });
  });

  it('calls onNavigate when configured', async () => {
    const onNavigate = vi.fn(async (path: string) => {
      window.history.pushState({}, '', path);
    });

    function NavigateView() {
      const { execute } = useAppAgent();
      return (
        <button
          onClick={() =>
            execute('go to attendance')
          }
        >
          Nav
        </button>
      );
    }

    render(
      <AppAgentSessionProvider
        config={{
          ...agentConfig,
          onNavigate,
          workflows: {
            attendance: {
              name: 'attendance',
              description: 'attendance page',
              steps: [{ id: 's1', name: 'nav', toolName: 'navigate', parameters: { path: '/attendance' } }],
            },
          },
        }}
        mountPanel={false}
      >
        <NavigateView />
      </AppAgentSessionProvider>
    );

    await act(async () => {
      screen.getByRole('button', { name: 'Nav' }).click();
    });

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('/attendance');
    });
  });
});
