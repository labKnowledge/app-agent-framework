import type { Pattern } from './types';

export class PatternMatcher {
  findMatchingPattern(task: string, patterns: Pattern[]): Pattern | null {
    if (patterns.length === 0) return null;

    let best: { pattern: Pattern; score: number } | null = null;
    const normalizedTask = this.normalize(task);

    for (const pattern of patterns) {
      const score = this.calculateSimilarity(normalizedTask, pattern.normalizedTask);
      if (!best || score > best.score) {
        best = { pattern, score };
      }
    }

    if (!best || best.score < 0.45) {
      return null;
    }

    return best.pattern;
  }

  calculateSimilarity(task1: string, task2: string): number {
    const a = this.tokenize(task1);
    const b = this.tokenize(task2);
    if (a.size === 0 || b.size === 0) return 0;

    let intersection = 0;
    for (const token of a) {
      if (b.has(token)) intersection += 1;
    }

    return intersection / Math.max(a.size, b.size);
  }

  normalize(task: string): string {
    return task
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenize(task: string): Set<string> {
    return new Set(this.normalize(task).split(' ').filter(Boolean));
  }
}
