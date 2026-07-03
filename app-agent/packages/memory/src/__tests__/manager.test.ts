import { describe, it, expect, afterEach } from 'vitest';
import { MemoryManager } from '../manager';

describe('MemoryManager', () => {
  let manager: MemoryManager;

  afterEach(() => {
    manager?.dispose();
  });

  it('creates and retrieves working memory', () => {
    manager = new MemoryManager();
    manager.updateWorkingMemory({
      currentTask: 'find laptop',
      currentGoal: 'purchase',
    });

    const results = manager.searchMemories({ type: 'working' });
    expect(results).toHaveLength(1);
    expect(results[0].memory.content).toMatchObject({
      type: 'working',
      currentTask: 'find laptop',
    });
  });

  it('adds observations and actions to working memory', () => {
    manager = new MemoryManager();
    manager.updateWorkingMemory({ currentTask: 'test', currentGoal: 'goal' });

    manager.addObservation({
      timestamp: Date.now(),
      type: 'dom',
      data: { url: '/shop' },
      importance: 0.5,
    });

    manager.addAction({
      timestamp: Date.now(),
      type: 'click',
      target: 'button',
      success: true,
    });

    const stats = manager.getStats();
    expect(stats.totalByType.working).toBe(1);
  });

  it('consolidates episodes into episodic memory', () => {
    manager = new MemoryManager();
    manager.updateWorkingMemory({ currentTask: 'checkout', currentGoal: 'complete order' });
    manager.addAction({
      timestamp: Date.now(),
      type: 'click',
      target: 'checkout',
      success: true,
    });

    manager.consolidateEpisode('checkout', 'success');

    const episodic = manager.searchMemories({ type: 'episodic' });
    expect(episodic.length).toBeGreaterThanOrEqual(1);
    expect(episodic[0].memory.content).toMatchObject({
      type: 'episodic',
      task: 'checkout',
      outcome: 'success',
    });
  });

  it('stores semantic memory and retrieves relevant context', () => {
    manager = new MemoryManager();
    manager.addSemanticMemory('Products are listed on the shop page', 0.9, 'observation', [
      'user navigated to shop',
    ]);

    const context = manager.getRelevantContext('shop products');
    expect(context.length).toBeGreaterThan(0);
    expect(context[0].content).toContain('shop');
  });

  it('filters memories by importance and tags', () => {
    manager = new MemoryManager();
    manager.addMemory(
      'semantic',
      { type: 'semantic', fact: 'Cart holds selected items', confidence: 0.8, source: 'user', evidence: [], contradictions: [], conditions: [] },
      { importance: 0.9, tags: ['cart'] }
    );
    manager.addMemory(
      'semantic',
      { type: 'semantic', fact: 'Settings page has preferences', confidence: 0.5, source: 'user', evidence: [], contradictions: [], conditions: [] },
      { importance: 0.2, tags: ['settings'] }
    );

    const results = manager.searchMemories({
      tags: ['cart'],
      minImportance: 0.5,
    });

    expect(results).toHaveLength(1);
    expect(results[0].memory.tags).toContain('cart');
  });
});
