import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { AppAgentCore } from '../agent';
import type { AgentConfig } from '../types';

describe('AppAgentCore app context routing', () => {
  const baseConfig: AgentConfig = {
    baseURL: 'https://api.example.com',
    model: 'test',
    getAppState: async () => ({
      currentView: '/dashboard',
      user: { id: '1', role: 'user', isAuthenticated: true },
      context: { locale: 'en', cartItems: ['item-1'] },
      timestamp: Date.now(),
    }),
    navigation: [
      { id: 'profile', path: '/profile', label: 'Profile', category: 'page' },
      { id: 'cart', path: '/cart', label: 'Cart', category: 'page', aliases: ['checkout cart'] },
      { id: 'attendance', path: '/attendance', label: 'Attendance', category: 'page' },
    ],
    capabilities: [
      {
        id: 'changeLanguage',
        name: 'Change Language',
        description: 'Set UI language',
        kind: 'setting',
        toolName: 'setLanguage',
        aliases: ['change language', 'locale'],
      },
    ],
    strictNavigation: true,
    customTools: {
      setLanguage: {
        name: 'setLanguage',
        description: 'Set language',
        inputSchema: z.object({ language: z.string().optional() }),
        execute: async () => 'Language updated to es',
      },
    },
  };

  it('routes change language to setLanguage without navigating to profile', async () => {
    const navigated: string[] = [];
    const agent = new AppAgentCore({
      ...baseConfig,
      onNavigate: (path) => {
        navigated.push(path);
      },
    });

    const result = await agent.execute('change language');
    expect(result.success).toBe(true);
    expect(result.result).toContain('Language updated');
    expect(navigated).not.toContain('/profile');
    agent.dispose();
  });

  it('does not navigate for informational questions in assistant mode', async () => {
    const navigated: string[] = [];
    const agent = new AppAgentCore({
      ...baseConfig,
      behaviorMode: 'assistant',
      discoverPageNavigation: false,
      onNavigate: (path) => {
        navigated.push(path);
      },
    });

    const mockObservation = {
      appState: await baseConfig.getAppState(),
      domState: {
        url: 'http://localhost/dashboard',
        title: 'Dashboard',
        content: '',
        header: 'Page: Dashboard',
        footer: '',
      },
      observations: [] as string[],
      stepNumber: 1,
      totalWaitTime: 0,
    };

    vi.spyOn(agent as unknown as { observe: () => Promise<typeof mockObservation> }, 'observe').mockResolvedValue(
      mockObservation
    );

    vi.spyOn(agent['llmClient'], 'invokeReAct').mockResolvedValue({
      reasoning: {
        evaluation_previous_goal: 'Starting task',
        memory: 'Your cart has 1 item.',
        next_goal: 'Answer the user',
        action: { done: true },
      },
      raw: '{}',
    });

    const result = await agent.execute("what's in my cart?");
    expect(result.success).toBe(true);
    expect(result.result).toContain('Your cart has 1 item');
    expect(navigated).toHaveLength(0);
    agent.dispose();
  });

  it('navigates on explicit go to in assistant mode', async () => {
    const navigated: string[] = [];
    const agent = new AppAgentCore({
      ...baseConfig,
      behaviorMode: 'assistant',
      onNavigate: (path) => {
        navigated.push(path);
      },
    });

    const result = await agent.execute('go to cart');
    expect(result.success).toBe(true);
    expect(navigated).toContain('/cart');
    expect(result.result).toContain('Navigated');
    agent.dispose();
  });

  it('fuzzy navigation still works in agent mode', async () => {
    const navigated: string[] = [];
    const agent = new AppAgentCore({
      ...baseConfig,
      behaviorMode: 'agent',
      onNavigate: (path) => {
        navigated.push(path);
      },
    });

    const result = await agent.execute('profile');
    expect(result.success).toBe(true);
    expect(navigated).toContain('/profile');
    agent.dispose();
  });
});
