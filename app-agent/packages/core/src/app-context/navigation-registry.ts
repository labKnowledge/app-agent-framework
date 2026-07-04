/**
 * Navigation registry — validated app routes
 */

import type { NavigationDestination } from '@gakwaya/app-agent-entities';

const STOP_WORDS = new Set(['the', 'a', 'an', 'to', 'for', 'go', 'open', 'show', 'my', 'please']);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function defaultNavigable(dest: NavigationDestination): boolean {
  if (dest.navigable !== undefined) {
    return dest.navigable;
  }
  return dest.category === 'page' || dest.category === 'settings' || dest.category === 'admin';
}

export class NavigationRegistry {
  private destinations = new Map<string, NavigationDestination>();

  constructor(destinations: NavigationDestination[] = []) {
    for (const dest of destinations) {
      this.register(dest);
    }
  }

  register(dest: NavigationDestination): void {
    this.destinations.set(dest.id, dest);
  }

  list(): NavigationDestination[] {
    return [...this.destinations.values()];
  }

  get(id: string): NavigationDestination | undefined {
    return this.destinations.get(id);
  }

  findByPath(path: string): NavigationDestination | undefined {
    const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
    for (const dest of this.destinations.values()) {
      const destPath = dest.path.split('?')[0].replace(/\/$/, '') || '/';
      if (destPath === normalized) {
        return dest;
      }
    }
    return undefined;
  }

  validatePath(path: string): {
    valid: boolean;
    destination?: NavigationDestination;
    suggestion?: string;
  } {
    const match = this.findByPath(path);
    if (match && defaultNavigable(match)) {
      return { valid: true, destination: match };
    }

    const suggestion = this.suggestClosest(path);
    return {
      valid: false,
      suggestion: suggestion?.path,
    };
  }

  resolve(task: string, threshold = 0.45): NavigationDestination | null {
    const taskTokens = tokenize(task);
    const normalizedTask = task.toLowerCase();

    let best: NavigationDestination | null = null;
    let bestScore = threshold;

    for (const dest of this.destinations.values()) {
      if (!defaultNavigable(dest)) {
        continue;
      }

      const corpus = [
        dest.label,
        dest.description ?? '',
        dest.path,
        dest.id,
        ...(dest.aliases ?? []),
      ]
        .join(' ')
        .toLowerCase();

      let score = 0;
      if (taskTokens.length > 0) {
        const hits = taskTokens.filter((t) => corpus.includes(t)).length;
        score = hits / taskTokens.length;
      }

      const labelLower = dest.label.toLowerCase();
      if (normalizedTask.includes(labelLower)) {
        score = Math.max(score, 0.9);
      }

      for (const alias of dest.aliases ?? []) {
        if (normalizedTask.includes(alias.toLowerCase())) {
          score = Math.max(score, 0.95);
        }
      }

      if (score > bestScore) {
        bestScore = score;
        best = dest;
      }
    }

    return best;
  }

  suggestClosest(path: string): NavigationDestination | null {
    const segment = path.split('/').filter(Boolean).pop()?.toLowerCase();
    if (!segment) {
      return null;
    }

    for (const dest of this.destinations.values()) {
      if (dest.path.toLowerCase().includes(segment) || dest.label.toLowerCase().includes(segment)) {
        return dest;
      }
    }
    return null;
  }
}
