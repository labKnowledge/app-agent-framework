import { describe, it, expect } from 'vitest';
import { NavigationRegistry } from '../app-context/navigation-registry';

describe('NavigationRegistry', () => {
  const registry = new NavigationRegistry([
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      category: 'page',
      aliases: ['home'],
    },
    {
      id: 'profile',
      path: '/profile',
      label: 'Profile',
      category: 'page',
    },
    {
      id: 'settings.language',
      path: '/settings/language',
      label: 'Language',
      category: 'settings',
      aliases: ['language settings'],
    },
  ]);

  it('validates registered paths', () => {
    expect(registry.validatePath('/dashboard').valid).toBe(true);
    expect(registry.validatePath('/random').valid).toBe(false);
  });

  it('resolves navigation intent', () => {
    const match = registry.resolve('go to dashboard');
    expect(match?.path).toBe('/dashboard');
  });

  it('suggests closest path for unknown routes', () => {
    const result = registry.validatePath('/prof');
    expect(result.valid).toBe(false);
    expect(result.suggestion).toBeDefined();
  });
});
