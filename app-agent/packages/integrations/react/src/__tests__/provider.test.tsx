/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { AppAgentProvider, useAppAgent } from '../index';

const agentConfig = {
  baseURL: 'https://api.example.com',
  model: 'test-model',
  getAppState: async () => ({
    currentView: 'shop',
    user: { id: '1', role: 'user', isAuthenticated: true },
    context: {},
    timestamp: Date.now(),
  }),
};

function StatusView() {
  const { status, execute } = useAppAgent();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <button onClick={() => execute('test task')}>Run</button>
    </div>
  );
}

describe('integrations-react', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('provides agent context to children', () => {
    render(
      <AppAgentProvider config={agentConfig} mountPanel={false}>
        <StatusView />
      </AppAgentProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });

  it('updates status when agent emits statuschange', () => {
    render(
      <AppAgentProvider config={agentConfig} mountPanel={false}>
        <StatusView />
      </AppAgentProvider>
    );

    const panel = document.querySelector('.app-agent-panel');
    expect(panel).toBeNull();

    act(() => {
      screen.getByRole('button', { name: 'Run' }).click();
    });

    expect(screen.getByTestId('status')).toBeTruthy();
  });
});
