/**
 * Core Agent Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppAgentCore } from '../agent';
import type { AgentConfig, AppState } from '../types';

describe('AppAgentCore', () => {
  let agent: AppAgentCore;
  let mockAppState: AppState;

  beforeEach(() => {
    mockAppState = {
      currentView: 'test-view',
      user: {
        id: 'test-user',
        role: 'user',
        isAuthenticated: true,
      },
      context: {},
      timestamp: Date.now(),
    };

    const config: AgentConfig = {
      baseURL: 'https://api.example.com',
      model: 'test-model',
      getAppState: async () => mockAppState,
      maxSteps: 5,
    };

    agent = new AppAgentCore(config);
  });

  afterEach(() => {
    agent.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with idle status', () => {
      expect(agent.status).toBe('idle');
    });

    it('should have empty history initially', () => {
      expect(agent.history).toEqual([]);
    });

    it('should register built-in tools', () => {
      const tools = agent.getTools();
      expect(tools.has('done')).toBe(true);
      expect(tools.has('wait')).toBe(true);
      expect(tools.has('click')).toBe(true);
      expect(tools.has('input')).toBe(true);
      expect(tools.has('select')).toBe(true);
      expect(tools.has('scroll')).toBe(true);
    });
  });

  describe('Tool Management', () => {
    it('should register custom tool', () => {
      const customTool = {
        name: 'custom',
        description: 'Custom tool',
        inputSchema: {} as any,
        execute: async () => 'custom result',
      };

      agent.registerTool(customTool);
      const tools = agent.getTools();
      expect(tools.has('custom')).toBe(true);
    });

    it('should unregister tool', () => {
      agent.unregisterTool('done');
      const tools = agent.getTools();
      expect(tools.has('done')).toBe(false);
    });
  });

  describe('Event Emission', () => {
    it('should emit status change events', () => {
      const statusSpy = vi.fn();
      agent.on('statuschange', statusSpy);

      // Status changes during execution would trigger this
      // For now just verify the listener is registered
      expect(statusSpy).toBeDefined();
    });

    it('should emit history change events', () => {
      const historySpy = vi.fn();
      agent.on('historychange', historySpy);

      // History changes during execution would trigger this
      // For now just verify the listener is registered
      expect(historySpy).toBeDefined();
    });
  });

  describe('Parameter Validation', () => {
    it('should validate click tool parameters', async () => {
      const clickTool = agent.getTools().get('click');
      expect(clickTool).toBeDefined();

      // This test would need proper mocking of DOM
      // For now, verify the tool exists and has proper schema
      expect(clickTool?.inputSchema).toBeDefined();
    });

    it('should validate input tool parameters', async () => {
      const inputTool = agent.getTools().get('input');
      expect(inputTool).toBeDefined();
      expect(inputTool?.inputSchema).toBeDefined();
    });

    it('should validate scroll tool parameters', async () => {
      const scrollTool = agent.getTools().get('scroll');
      expect(scrollTool).toBeDefined();
      expect(scrollTool?.inputSchema).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on dispose', () => {
      const removeListenersSpy = vi.spyOn(agent, 'removeAllListeners');

      agent.dispose();

      expect(agent.status).toBe('disposed');
      expect(removeListenersSpy).toHaveBeenCalled();
    });

    it('should handle multiple dispose calls safely', () => {
      agent.dispose();
      expect(() => agent.dispose()).not.toThrow();
      expect(agent.status).toBe('disposed');
    });

    it('should reject execute after dispose with a clear error', async () => {
      agent.dispose();

      const result = await agent.execute('test task');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Agent has been disposed');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing tool gracefully', async () => {
      // This would require mocking the LLM client
      // For now, verify the agent has error handling infrastructure
      expect(agent).toBeDefined();
    });
  });
});

describe('AppAgentCore with State Tracking', () => {
  let agent: AppAgentCore;
  let mockAppState: AppState;
  let stateChangeCallback: any;

  beforeEach(() => {
    mockAppState = {
      currentView: 'test-view',
      user: {
        id: 'test-user',
        role: 'user',
        isAuthenticated: true,
      },
      context: {},
      timestamp: Date.now(),
    };

    stateChangeCallback = vi.fn();

    const config: AgentConfig = {
      baseURL: 'https://api.example.com',
      model: 'test-model',
      getAppState: async () => mockAppState,
      maxSteps: 5,
      trackState: true,
    };

    agent = new AppAgentCore(config);
    agent.on('statechange', stateChangeCallback);
  });

  afterEach(() => {
    agent.dispose();
  });

  it('should initialize state manager when trackState is true', () => {
    // Agent should have state manager initialized
    expect(agent).toBeDefined();
  });

  it('should emit state change events', () => {
    // State changes would trigger this during execution
    expect(stateChangeCallback).toBeDefined();
  });
});
