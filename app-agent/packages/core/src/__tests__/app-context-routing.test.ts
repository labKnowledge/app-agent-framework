import { describe, it, expect } from 'vitest';
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
      context: { locale: 'en' },
      timestamp: Date.now(),
    }),
    navigation: [
      { id: 'profile', path: '/profile', label: 'Profile', category: 'page' },
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
});
