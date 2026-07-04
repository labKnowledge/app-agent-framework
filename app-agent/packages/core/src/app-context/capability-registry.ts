/**
 * Capability registry — settings, mutations, queries
 */

import type { AppCapability } from '@gakwaya/app-agent-entities';

const STOP_WORDS = new Set(['the', 'a', 'an', 'to', 'for', 'my', 'please', 'can', 'you']);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function humanize(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase();
}

export interface CapabilityMatch {
  capability: AppCapability;
  score: number;
}

export class CapabilityRegistry {
  private capabilities = new Map<string, AppCapability>();

  constructor(capabilities: AppCapability[] = []) {
    for (const cap of capabilities) {
      this.register(cap);
    }
  }

  register(cap: AppCapability): void {
    this.capabilities.set(cap.id, cap);
  }

  list(): AppCapability[] {
    return [...this.capabilities.values()];
  }

  match(task: string, threshold = 0.5): CapabilityMatch | null {
    const taskTokens = tokenize(task);
    const normalizedTask = task.toLowerCase();

    let best: CapabilityMatch | null = null;

    for (const cap of this.capabilities.values()) {
      const humanName = humanize(cap.name);
      const corpus = [cap.name, humanName, cap.description, cap.toolName, ...(cap.aliases ?? [])]
        .join(' ')
        .toLowerCase();

      let score = 0;
      if (taskTokens.length > 0) {
        const hits = taskTokens.filter((t) => corpus.includes(t)).length;
        score = hits / taskTokens.length;
      }

      if (normalizedTask.includes(humanName) || normalizedTask.includes(cap.id.toLowerCase())) {
        score = Math.max(score, 0.85);
      }

      for (const alias of cap.aliases ?? []) {
        if (normalizedTask.includes(alias.toLowerCase())) {
          score = Math.max(score, 0.95);
        }
      }

      if (cap.kind === 'setting') {
        score += 0.05;
      }

      if (score >= threshold && (!best || score > best.score)) {
        best = { capability: cap, score };
      }
    }

    return best;
  }
}
