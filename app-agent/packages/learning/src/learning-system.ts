import { PatternMatcher } from './pattern-matcher';
import { InMemoryPatternStorage } from './storage/memory-storage';
import { IndexedDBPatternStorage } from './storage/indexed-db-storage';
import type {
  LearningConfig,
  Pattern,
  PatternStep,
  PatternStorage,
  RecordPatternInput,
} from './types';

export class LearningSystem {
  private readonly matcher = new PatternMatcher();
  private readonly storage: PatternStorage;
  private readonly config: Required<LearningConfig>;

  constructor(config: LearningConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      storage: config.storage ?? 'memory',
      retentionDays: config.retentionDays ?? 30,
      minSuccessRate: config.minSuccessRate ?? 0.5,
      maxPatterns: config.maxPatterns ?? 200,
    };

    this.storage =
      this.config.storage === 'indexedDB'
        ? new IndexedDBPatternStorage()
        : new InMemoryPatternStorage();
  }

  async findPattern(task: string): Promise<Pattern | null> {
    if (!this.config.enabled) return null;

    const patterns = await this.storage.list();
    const eligible = patterns.filter((p) => p.successRate >= this.config.minSuccessRate);
    const match = this.matcher.findMatchingPattern(task, eligible);

    if (match) {
      const updated: Pattern = {
        ...match,
        usageCount: match.usageCount + 1,
        lastUsed: Date.now(),
      };
      await this.storage.save(updated);
    }

    return match;
  }

  getPatternHint(pattern: Pattern): string {
    const steps = pattern.steps
      .map((s) => `${s.action}(${JSON.stringify(s.parameters)})`)
      .join(' -> ');
    return `Prior successful pattern (${Math.round(pattern.successRate * 100)}%): ${steps}`;
  }

  async recordPattern(input: RecordPatternInput): Promise<void> {
    if (!this.config.enabled || !input.result.success) return;

    const normalizedTask = this.matcher.normalize(input.task);
    const existing = (await this.storage.list()).find((p) => p.normalizedTask === normalizedTask);

    if (existing) {
      const usageCount = existing.usageCount + 1;
      const successRate = (existing.successRate * existing.usageCount + 1) / usageCount;
      const averageTime =
        (existing.averageTime * existing.usageCount + input.durationMs) / usageCount;

      await this.storage.save({
        ...existing,
        steps: input.steps,
        usageCount,
        successRate,
        averageTime,
        lastUsed: Date.now(),
      });
      return;
    }

    const pattern: Pattern = {
      id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      task: input.task,
      normalizedTask,
      steps: input.steps,
      successRate: 1,
      averageTime: input.durationMs,
      lastUsed: Date.now(),
      usageCount: 1,
    };

    await this.storage.save(pattern);
    await this.prunePatterns();
  }

  extractStepsFromHistory(history: Array<{ type: string; data?: unknown }>): PatternStep[] {
    return history
      .filter((event) => event.type === 'action' && event.data && typeof event.data === 'object')
      .map((event) => {
        const data = event.data as { action?: Record<string, unknown> };
        const action = data.action ?? {};
        const { type, ...rest } = action;
        return {
          action: String(type ?? 'unknown'),
          parameters: rest as Record<string, unknown>,
          outcome: 'success',
        };
      });
  }

  private async prunePatterns(): Promise<void> {
    const patterns = await this.storage.list();
    const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;

    const sorted = patterns
      .filter((p) => p.lastUsed >= cutoff)
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, this.config.maxPatterns);

    const keepIds = new Set(sorted.map((p) => p.id));
    for (const pattern of patterns) {
      if (!keepIds.has(pattern.id)) {
        await this.storage.delete(pattern.id);
      }
    }
  }
}

export type { LearningConfig, Pattern, PatternStep, RecordPatternInput };
