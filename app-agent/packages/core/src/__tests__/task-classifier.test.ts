import { describe, it, expect } from 'vitest';
import { CapabilityRegistry } from '../app-context/capability-registry';
import { NavigationRegistry } from '../app-context/navigation-registry';
import { classifyTask } from '../app-context/task-classifier';

describe('task-classifier', () => {
  const navigation = new NavigationRegistry([
    {
      id: 'profile',
      path: '/profile',
      label: 'Profile',
      category: 'page',
    },
    {
      id: 'cart',
      path: '/cart',
      label: 'Cart',
      category: 'page',
      aliases: ['checkout cart'],
    },
    {
      id: 'attendance',
      path: '/attendance',
      label: 'Attendance',
      category: 'page',
      aliases: ['check in'],
    },
  ]);

  const capabilities = new CapabilityRegistry([
    {
      id: 'changeLanguage',
      name: 'Change Language',
      description: 'Update UI locale',
      kind: 'setting',
      toolName: 'setLanguage',
      aliases: ['change language', 'locale', 'language settings'],
    },
  ]);

  it('classifies change language as setting capability', () => {
    const result = classifyTask('change language to Spanish', navigation, capabilities);
    expect(result.intent).toBe('setting');
    expect(result.toolName).toBe('setLanguage');
    expect(result.path).toBeUndefined();
  });

  it('classifies explicit navigation to attendance', () => {
    const result = classifyTask('go to attendance', navigation, capabilities);
    expect(result.intent).toBe('navigation');
    expect(result.path).toBe('/attendance');
  });

  it('classifies informational cart question as informational in assistant mode', () => {
    const result = classifyTask("what's in my cart?", navigation, capabilities, {
      behaviorMode: 'assistant',
    });
    expect(result.intent).toBe('informational');
    expect(result.path).toBeUndefined();
  });

  it('classifies informational profile question as informational in assistant mode', () => {
    const result = classifyTask('tell me about my profile', navigation, capabilities, {
      behaviorMode: 'assistant',
    });
    expect(result.intent).toBe('informational');
  });

  it('navigates on explicit go to cart in assistant mode', () => {
    const result = classifyTask('go to cart', navigation, capabilities, {
      behaviorMode: 'assistant',
    });
    expect(result.intent).toBe('navigation');
    expect(result.path).toBe('/cart');
  });

  it('fuzzy cart match navigates in agent mode', () => {
    const result = classifyTask('cart', navigation, capabilities, { behaviorMode: 'agent' });
    expect(result.intent).toBe('navigation');
    expect(result.path).toBe('/cart');
  });

  it('fuzzy cart match is unknown in assistant mode without explicit nav', () => {
    const result = classifyTask('cart', navigation, capabilities, { behaviorMode: 'assistant' });
    expect(result.intent).toBe('unknown');
  });
});
