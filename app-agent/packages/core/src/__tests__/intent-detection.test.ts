import { describe, it, expect } from 'vitest';
import { isInformationalTask, isExplicitNavigationTask } from '../app-context/intent-detection';

describe('intent-detection', () => {
  describe('isInformationalTask', () => {
    it('detects question patterns', () => {
      expect(isInformationalTask("what's in my cart?")).toBe(true);
      expect(isInformationalTask('tell me about my profile')).toBe(true);
      expect(isInformationalTask('how many items do I have')).toBe(true);
      expect(isInformationalTask('can you explain attendance')).toBe(true);
    });

    it('returns false for explicit navigation phrasing', () => {
      expect(isInformationalTask('go to cart')).toBe(false);
      expect(isInformationalTask('open profile')).toBe(false);
    });
  });

  describe('isExplicitNavigationTask', () => {
    it('detects navigation verbs', () => {
      expect(isExplicitNavigationTask('go to cart')).toBe(true);
      expect(isExplicitNavigationTask('open profile')).toBe(true);
      expect(isExplicitNavigationTask('navigate to /attendance')).toBe(true);
      expect(isExplicitNavigationTask('take me to dashboard')).toBe(true);
      expect(isExplicitNavigationTask('show me the cart page')).toBe(true);
    });

    it('returns false for informational questions', () => {
      expect(isExplicitNavigationTask("what's in my cart?")).toBe(false);
      expect(isExplicitNavigationTask('tell me about profile')).toBe(false);
    });
  });
});
