/**
 * Memory Manager
 *
 * Comprehensive memory management system for AI agents
 * Handles working memory, episodic memory, and semantic memory
 */

import type {
  MemoryManagerConfig,
  MemoryEntry,
  MemoryType,
  MemoryContent,
  MemoryQuery,
  MemoryResult,
  MemoryStats,
  WorkingMemory,
  EpisodicMemory,
  SemanticMemory,
  Observation,
  Action,
  MemoryConsolidationConfig,
} from './types';

/**
 * Memory Manager Class
 */
export class MemoryManager {
  private config: Required<MemoryManagerConfig>;
  private memories: Map<string, MemoryEntry> = new Map();
  private workingMemories: MemoryEntry[] = [];
  private episodicMemories: MemoryEntry[] = [];
  private semanticMemories: MemoryEntry[] = [];
  private consolidationInterval: ReturnType<typeof setInterval> | null = null;
  private accessTracker: Map<string, number> = new Map();

  constructor(config: MemoryManagerConfig = {}) {
    this.config = {
      maxWorkingMemory: config.maxWorkingMemory ?? 50,
      maxEpisodicMemory: config.maxEpisodicMemory ?? 1000,
      maxSemanticMemory: config.maxSemanticMemory ?? 500,
      consolidation: {
        workingMemoryRetention: config.consolidation?.workingMemoryRetention ?? 300000, // 5 minutes
        consolidationInterval: config.consolidation?.consolidationInterval ?? 60000, // 1 minute
        maxEpisodicMemories: config.consolidation?.maxEpisodicMemories ?? 1000,
        importanceThreshold: config.consolidation?.importanceThreshold ?? 0.5,
        enableCompression: config.consolidation?.enableCompression ?? true,
      },
      enablePersistence: config.enablePersistence ?? false,
      persistenceKey: config.persistenceKey ?? 'app-agent-memory',
    };

    // Load from persistence if enabled
    if (this.config.enablePersistence) {
      this.loadFromPersistence();
    }

    // Start consolidation process
    this.startConsolidation();
  }

  /**
   * Add memory entry
   */
  addMemory(type: MemoryType, content: MemoryContent, options: {
    importance?: number;
    tags?: string[];
    expiresAt?: number;
  } = {}): MemoryEntry {
    const entry: MemoryEntry = {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      content,
      importance: options.importance ?? 0.5,
      tags: options.tags ?? [],
      expiresAt: options.expiresAt,
    };

    this.memories.set(entry.id, entry);
    this.addToTypeIndex(entry);

    // Enforce limits
    this.enforceMemoryLimits();

    // Persist if enabled
    if (this.config.enablePersistence) {
      this.saveToPersistence();
    }

    return entry;
  }

  /**
   * Get memory by ID
   */
  getMemory(id: string): MemoryEntry | undefined {
    const memory = this.memories.get(id);
    if (memory) {
      // Update access tracking
      memory.lastAccessed = Date.now();
      memory.accessCount++;
      this.accessTracker.set(id, (this.accessTracker.get(id) || 0) + 1);
    }
    return memory;
  }

  /**
   * Search memories
   */
  searchMemories(query: MemoryQuery): MemoryResult[] {
    const results: MemoryResult[] = [];
    const now = Date.now();

    // Filter expired memories
    for (const memory of this.memories.values()) {
      if (memory.expiresAt && memory.expiresAt < now) {
        continue;
      }

      // Type filter
      if (query.type) {
        const types = Array.isArray(query.type) ? query.type : [query.type];
        if (!types.includes(memory.type)) {
          continue;
        }
      }

      // Time range filter
      if (query.timeRange) {
        if (memory.timestamp < query.timeRange.start || memory.timestamp > query.timeRange.end) {
          continue;
        }
      }

      // Importance filter
      if (query.minImportance && memory.importance < query.minImportance) {
        continue;
      }

      // Calculate relevance
      const relevance = this.calculateRelevance(memory, query);
      if (query.relevanceThreshold && relevance < query.relevanceThreshold) {
        continue;
      }

      results.push({
        memory,
        relevance,
        reason: this.getMatchReason(memory, query),
      });
    }

    // Sort by relevance and limit results
    results.sort((a, b) => b.relevance - a.relevance);
    if (query.maxResults) {
      return results.slice(0, query.maxResults);
    }

    return results;
  }

  /**
   * Update working memory
   */
  updateWorkingMemory(updates: Partial<WorkingMemory>): void {
    // Find or create working memory
    let workingMemory = this.workingMemories[0];

    if (!workingMemory) {
      workingMemory = this.addMemory('working', {
        type: 'working',
        currentTask: '',
        currentGoal: '',
        recentObservations: [],
        recentActions: [],
        context: {},
        temporaryState: {},
      });
    }

    // Update content
    const content = workingMemory.content as WorkingMemory;
    Object.assign(content, updates);

    workingMemory.lastAccessed = Date.now();
  }

  /**
   * Add observation to working memory
   */
  addObservation(observation: Observation): void {
    const workingMemory = this.workingMemories[0];
    if (workingMemory) {
      const content = workingMemory.content as WorkingMemory;
      content.recentObservations.push(observation);

      // Keep only recent observations (last 20)
      if (content.recentObservations.length > 20) {
        content.recentObservations = content.recentObservations.slice(-20);
      }
    }
  }

  /**
   * Add action to working memory
   */
  addAction(action: Action): void {
    const workingMemory = this.workingMemories[0];
    if (workingMemory) {
      const content = workingMemory.content as WorkingMemory;
      content.recentActions.push(action);

      // Keep only recent actions (last 10)
      if (content.recentActions.length > 10) {
        content.recentActions = content.recentActions.slice(-10);
      }
    }
  }

  /**
   * Consolidate episode to episodic memory
   */
  consolidateEpisode(task: string, outcome: 'success' | 'failure' | 'partial'): void {
    const workingMemory = this.workingMemories[0];
    if (!workingMemory) {
      return;
    }

    const content = workingMemory.content as WorkingMemory;
    const startTime = content.recentObservations[0]?.timestamp || Date.now();
    const duration = Date.now() - startTime;

    // Extract lessons from outcome
    const lessons = this.extractLessons(content, outcome);

    // Create episodic memory
    const episodicMemory: EpisodicMemory = {
      type: 'episodic',
      task,
      actions: content.recentActions,
      outcome,
      lessons,
      duration,
      context: content.context,
      relatedMemories: [],
    };

    // Calculate importance based on outcome and duration
    const importance = this.calculateEpisodeImportance(episodicMemory);

    this.addMemory('episodic', episodicMemory, {
      importance,
      tags: [task, outcome],
    });

    // Clear working memory
    this.clearWorkingMemory();
  }

  /**
   * Add semantic memory (learned fact)
   */
  addSemanticMemory(
    fact: string,
    confidence: number,
    source: SemanticMemory['source'],
    evidence: string[] = [],
  ): void {
    // Check for contradictions
    const contradictions = this.findContradictions(fact);

    const semanticMemory: SemanticMemory = {
      type: 'semantic',
      fact,
      confidence,
      source,
      evidence,
      contradictions,
      conditions: [],
    };

    this.addMemory('semantic', semanticMemory, {
      importance: confidence,
      tags: this.extractTags(fact),
    });
  }

  /**
   * Get relevant context for current situation
   */
  getRelevantContext(query: string, maxResults = 5): Array<{ content: string; relevance: number }> {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);

    const results = this.searchMemories({
      terms,
      maxResults,
      relevanceThreshold: 0.3,
    });

    return results.map(result => ({
      content: this.formatMemoryContent(result.memory),
      relevance: result.relevance,
    }));
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const stats: MemoryStats = {
      totalByType: {
        working: this.workingMemories.length,
        episodic: this.episodicMemories.length,
        semantic: this.semanticMemories.length,
      },
      avgImportance: {
        working: 0,
        episodic: 0,
        semantic: 0,
      },
      mostAccessed: [],
      memoryUsage: 0,
      consolidation: {
        totalConsolidated: 0,
        lastConsolidation: 0,
        compressionRatio: 0,
      },
    };

    // Calculate average importance
    for (const type of ['working', 'episodic', 'semantic'] as MemoryType[]) {
      const memories = this.getByType(type);
      if (memories.length > 0) {
        const totalImportance = memories.reduce((sum, m) => sum + m.importance, 0);
        stats.avgImportance[type] = totalImportance / memories.length;
      }
    }

    // Get most accessed memories
    stats.mostAccessed = Array.from(this.accessTracker.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => ({ id, accessCount: count }));

    return stats;
  }

  /**
   * Clear all memories
   */
  clearAll(): void {
    this.memories.clear();
    this.workingMemories = [];
    this.episodicMemories = [];
    this.semanticMemories = [];
    this.accessTracker.clear();

    if (this.config.enablePersistence) {
      this.saveToPersistence();
    }
  }

  /**
   * Clear working memory
   */
  clearWorkingMemory(): void {
    for (const memory of this.workingMemories) {
      this.memories.delete(memory.id);
    }
    this.workingMemories = [];

    if (this.config.enablePersistence) {
      this.saveToPersistence();
    }
  }

  /**
   * Dispose of memory manager
   */
  dispose(): void {
    if (this.consolidationInterval) {
      clearInterval(this.consolidationInterval);
      this.consolidationInterval = null;
    }

    // Save to persistence before disposing
    if (this.config.enablePersistence) {
      this.saveToPersistence();
    }

    this.clearAll();
  }

  /**
   * Private methods
   */

  private addToTypeIndex(memory: MemoryEntry): void {
    switch (memory.type) {
      case 'working':
        this.workingMemories.push(memory);
        break;
      case 'episodic':
        this.episodicMemories.push(memory);
        break;
      case 'semantic':
        this.semanticMemories.push(memory);
        break;
    }
  }

  private getByType(type: MemoryType): MemoryEntry[] {
    switch (type) {
      case 'working':
        return this.workingMemories;
      case 'episodic':
        return this.episodicMemories;
      case 'semantic':
        return this.semanticMemories;
    }
  }

  private enforceMemoryLimits(): void {
    // Enforce working memory limit
    while (this.workingMemories.length > this.config.maxWorkingMemory) {
      const oldest = this.workingMemories.shift();
      if (oldest) this.memories.delete(oldest.id);
    }

    // Enforce episodic memory limit
    while (this.episodicMemories.length > this.config.maxEpisodicMemory) {
      const removed = this.episodicMemories.shift();
      if (removed) this.memories.delete(removed.id);
    }

    // Enforce semantic memory limit
    while (this.semanticMemories.length > this.config.maxSemanticMemory) {
      const removed = this.semanticMemories.shift();
      if (removed) this.memories.delete(removed.id);
    }
  }

  private calculateRelevance(memory: MemoryEntry, query: MemoryQuery): number {
    let relevance = 0.5; // Base relevance

    // Importance boost
    relevance += memory.importance * 0.2;

    // Recency boost
    const age = Date.now() - memory.timestamp;
    const recencyBoost = Math.max(0, 1 - age / 86400000); // Decay over 24 hours
    relevance += recencyBoost * 0.1;

    // Access frequency boost
    const accessBoost = Math.min(memory.accessCount / 100, 0.1);
    relevance += accessBoost;

    // Term matching
    if (query.terms && query.terms.length > 0) {
      const content = this.formatMemoryContent(memory).toLowerCase();
      const matchCount = query.terms.filter(term => content.includes(term.toLowerCase())).length;
      const termBoost = (matchCount / query.terms.length) * 0.3;
      relevance += termBoost;
    }

    // Tag matching
    if (query.tags && query.tags.length > 0) {
      const tagMatchCount = query.tags.filter(tag => memory.tags.includes(tag)).length;
      const tagBoost = (tagMatchCount / query.tags.length) * 0.2;
      relevance += tagBoost;
    }

    return Math.min(relevance, 1.0);
  }

  private getMatchReason(memory: MemoryEntry, query: MemoryQuery): string {
    const reasons: string[] = [];

    if (memory.importance > 0.7) {
      reasons.push('high importance');
    }

    if (memory.accessCount > 10) {
      reasons.push('frequently accessed');
    }

    if (Date.now() - memory.timestamp < 3600000) {
      reasons.push('recent');
    }

    if (query.tags && query.tags.some(tag => memory.tags.includes(tag))) {
      reasons.push('tag match');
    }

    return reasons.join(', ') || 'general relevance';
  }

  private formatMemoryContent(memory: MemoryEntry): string {
    const content = memory.content;

    switch (content.type) {
      case 'working':
        const working = content as WorkingMemory;
        return `Task: ${working.currentTask} | Goal: ${working.currentGoal}`;

      case 'episodic':
        const episodic = content as EpisodicMemory;
        return `Task: ${episodic.task} | Outcome: ${episodic.outcome}`;

      case 'semantic':
        const semantic = content as SemanticMemory;
        return semantic.fact;

      default:
        return JSON.stringify(content);
    }
  }

  private extractLessons(workingMemory: WorkingMemory, outcome: 'success' | 'failure' | 'partial'): string[] {
    const lessons: string[] = [];

    // Extract lessons from successful actions
    const successfulActions = workingMemory.recentActions.filter(a => a.success);
    if (successfulActions.length > 0) {
      lessons.push(`${successfulActions.length} actions succeeded`);
    }

    // Extract lessons from failed actions
    const failedActions = workingMemory.recentActions.filter(a => !a.success);
    if (failedActions.length > 0) {
      lessons.push(`${failedActions.length} actions failed - avoid these patterns`);
    }

    // Add outcome-based lesson
    if (outcome === 'success') {
      lessons.push('Task completed successfully - this approach works');
    } else if (outcome === 'failure') {
      lessons.push('Task failed - this approach needs modification');
    } else {
      lessons.push('Task partially completed - some adjustments needed');
    }

    return lessons;
  }

  private calculateEpisodeImportance(episode: EpisodicMemory): number {
    let importance = 0.5;

    // Boost based on outcome
    if (episode.outcome === 'success') {
      importance += 0.2;
    } else if (episode.outcome === 'failure') {
      importance += 0.1; // Failures are also important learning opportunities
    }

    // Boost based on duration (very short or very long tasks are notable)
    if (episode.duration < 10000) {
      importance += 0.1; // Quick tasks
    } else if (episode.duration > 300000) {
      importance += 0.1; // Long tasks
    }

    // Boost based on number of actions
    if (episode.actions.length > 10) {
      importance += 0.1;
    }

    return Math.min(importance, 1.0);
  }

  private findContradictions(fact: string): string[] {
    const contradictions: string[] = [];

    for (const memory of this.semanticMemories) {
      const content = memory.content as SemanticMemory;
      // Simple contradiction detection - can be enhanced
      if (content.fact.includes('not ') && fact.replace('not ', '') === content.fact.replace('not ', '')) {
        contradictions.push(content.fact);
      }
    }

    return contradictions;
  }

  private extractTags(fact: string): string[] {
    // Simple tag extraction - can be enhanced with NLP
    const words = fact.toLowerCase().split(/\s+/);
    const tags: string[] = [];

    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'not', 'but', 'and', 'or', 'if', 'then', 'when', 'where', 'how', 'what', 'why', 'who']);

    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        tags.push(word);
      }
    }

    return tags.slice(0, 5); // Limit to 5 tags
  }

  private startConsolidation(): void {
    this.consolidationInterval = setInterval(() => {
      this.consolidateMemories();
    }, this.config.consolidation.consolidationInterval);
  }

  private consolidateMemories(): void {
    const now = Date.now();
    const retentionTime = this.config.consolidation.workingMemoryRetention;

    // Move old working memories to episodic if they're important enough
    for (const workingMemory of [...this.workingMemories]) {
      if (now - workingMemory.timestamp > retentionTime) {
        if (workingMemory.importance >= this.config.consolidation.importanceThreshold) {
          // Convert to episodic memory
          const content = workingMemory.content as WorkingMemory;
          if (content.currentTask) {
            this.consolidateEpisode(content.currentTask, 'partial');
          }
        }

        // Remove from working memory
        this.memories.delete(workingMemory.id);
        this.workingMemories = this.workingMemories.filter(m => m.id !== workingMemory.id);
      }
    }
  }

  private generateId(): string {
    return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToPersistence(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data = {
        memories: Array.from(this.memories.entries()),
        timestamp: Date.now(),
      };

      localStorage.setItem(this.config.persistenceKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save memories to persistence:', error);
    }
  }

  private loadFromPersistence(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data = localStorage.getItem(this.config.persistenceKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.memories = new Map(parsed.memories);

        // Rebuild type indices
        for (const memory of this.memories.values()) {
          this.addToTypeIndex(memory);
        }
      }
    } catch (error) {
      console.error('Failed to load memories from persistence:', error);
    }
  }
}
