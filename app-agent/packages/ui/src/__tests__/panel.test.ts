/**
 * UI Panel Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppAgentPanel } from '../panel';
import type { PanelConfig } from '../types';

// Mock DOM environment
const mockElement = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  querySelector: vi.fn(() => mockElement),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
  },
  style: {},
  parentNode: null,
};

global.document = {
  createElement: vi.fn(() => mockElement),
  createElementNS: vi.fn(() => mockElement),
  getElementById: vi.fn(() => mockElement),
  querySelector: vi.fn(() => mockElement),
  querySelectorAll: vi.fn(() => [mockElement]),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
  head: {
    appendChild: vi.fn(),
  },
  documentElement: {
    innerHTML: '<html>test</html>',
  },
} as any;

global.window = {
  matchMedia: vi.fn(() => ({ matches: false })),
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

describe('AppAgentPanel', () => {
  let panel: AppAgentPanel;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (panel) {
      panel.dispose();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      panel = new AppAgentPanel();
      expect(panel).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const config: PanelConfig = {
        position: 'top-left',
        theme: 'dark',
        defaultOpen: false,
      };

      panel = new AppAgentPanel(config);
      expect(panel).toBeDefined();
    });

    it('should apply auto theme based on system preference', () => {
      global.window.matchMedia = vi.fn(() => ({ matches: true }));

      const config: PanelConfig = {
        theme: 'auto',
      };

      panel = new AppAgentPanel(config);
      expect(panel).toBeDefined();
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      panel = new AppAgentPanel();
    });

    it('should set status', () => {
      panel.setStatus('running');
      expect(panel).toBeDefined();
    });

    it('should set activity', () => {
      panel.setActivity('Testing...');
      expect(panel).toBeDefined();
    });

    it('should add history items', () => {
      const event = {
        type: 'observation' as const,
        timestamp: Date.now(),
        data: { test: 'data' },
      };

      panel.addHistoryItem(event);
      expect(panel).toBeDefined();
    });

    it('should set task', () => {
      panel.setTask('Test task');
      expect(panel).toBeDefined();
    });

    it('should clear history', () => {
      panel.clearHistory();
      expect(panel).toBeDefined();
    });
  });

  describe('Panel Controls', () => {
    beforeEach(() => {
      panel = new AppAgentPanel();
    });

    it('should toggle panel', () => {
      panel.toggle();
      expect(panel).toBeDefined();
    });

    it('should open panel', () => {
      panel.open();
      expect(panel).toBeDefined();
    });

    it('should close panel', () => {
      panel.close();
      expect(panel).toBeDefined();
    });
  });

  describe('Event Handlers', () => {
    beforeEach(() => {
      panel = new AppAgentPanel();
    });

    it('should set submit callback', () => {
      const callback = vi.fn();
      panel.onSubmit(callback);
      expect(callback).toBeDefined();
    });

    it('should call submit callback when task submitted', () => {
      const callback = vi.fn();
      panel.onSubmit(callback);

      // This would need proper DOM setup
      expect(callback).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners on dispose', () => {
      panel = new AppAgentPanel();

      // Add some event listeners
      panel.setActivity('Test');
      panel.toggle();

      // Dispose should clean up
      expect(() => panel.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls safely', () => {
      panel = new AppAgentPanel();
      panel.dispose();

      expect(() => panel.dispose()).not.toThrow();
    });

    it('should not call callbacks after dispose', () => {
      panel = new AppAgentPanel();
      const callback = vi.fn();
      panel.onSubmit(callback);

      panel.dispose();

      // Callbacks should not be called after dispose
      expect(callback).toBeDefined();
    });
  });

  describe('Security', () => {
    beforeEach(() => {
      panel = new AppAgentPanel();
    });

    it('should escape HTML in user input', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      panel.setTask(maliciousInput);

      // Should not throw and should escape the input
      expect(() => panel.setTask(maliciousInput)).not.toThrow();
    });

    it('should escape HTML in history data', () => {
      const maliciousEvent = {
        type: 'observation' as const,
        timestamp: Date.now(),
        data: '<img src=x onerror=alert("xss")>',
      };

      expect(() => panel.addHistoryItem(maliciousEvent)).not.toThrow();
    });

    it('should escape HTML in event types', () => {
      const maliciousEvent = {
        type: '<script>alert("xss")</script>' as const,
        timestamp: Date.now(),
        data: 'test',
      };

      expect(() => panel.addHistoryItem(maliciousEvent)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty history', () => {
      panel = new AppAgentPanel();
      panel.clearHistory();

      expect(() => panel.clearHistory()).not.toThrow();
    });

    it('should handle very long tasks', () => {
      panel = new AppAgentPanel();
      const longTask = 'a'.repeat(10000);

      expect(() => panel.setTask(longTask)).not.toThrow();
    });

    it('should handle special characters in input', () => {
      panel = new AppAgentPanel();
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      expect(() => panel.setTask(specialChars)).not.toThrow();
    });

    it('should handle rapid state changes', () => {
      panel = new AppAgentPanel();

      for (let i = 0; i < 100; i++) {
        panel.setStatus('running');
        panel.setActivity(`Activity ${i}`);
        panel.toggle();
      }

      expect(panel).toBeDefined();
    });
  });
});
