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

  it('classifies attendance navigation separately from profile', () => {
    const result = classifyTask('go to attendance', navigation, capabilities);
    expect(result.intent).toBe('navigation');
    expect(result.path).toBe('/attendance');
  });
});
