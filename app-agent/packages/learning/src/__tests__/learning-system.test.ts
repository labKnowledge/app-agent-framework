import { describe, it, expect } from 'vitest';
import { LearningSystem } from '../learning-system';
import { PatternMatcher } from '../pattern-matcher';

describe('PatternMatcher', () => {
  const matcher = new PatternMatcher();

  it('scores similar tasks higher', () => {
    const score = matcher.calculateSimilarity(
      'add laptop to cart',
      'add laptop to my cart'
    );
    expect(score).toBeGreaterThan(0.5);
  });
});

describe('LearningSystem', () => {
  it('records and retrieves patterns', async () => {
    const learning = new LearningSystem({ storage: 'memory' });

    await learning.recordPattern({
      task: 'Add laptop to cart',
      steps: [{ action: 'click', parameters: { selector: '#add-cart' }, outcome: 'success' }],
      result: { success: true, result: 'done', steps: 2, history: [] },
      durationMs: 1200,
    });

    const pattern = await learning.findPattern('add laptop to cart');
    expect(pattern).not.toBeNull();
    expect(pattern?.steps[0].action).toBe('click');
  });

  it('returns pattern hint text', async () => {
    const learning = new LearningSystem({ storage: 'memory' });
    await learning.recordPattern({
      task: 'checkout order',
      steps: [{ action: 'click', parameters: { id: 'checkout' }, outcome: 'success' }],
      result: { success: true, result: 'ok', steps: 1, history: [] },
      durationMs: 800,
    });

    const pattern = await learning.findPattern('checkout my order');
    expect(pattern).not.toBeNull();
    expect(learning.getPatternHint(pattern!)).toContain('click');
  });
});
