import type { AgentResult } from '@app-agent/entities';

export type LearningStorageType = 'memory' | 'indexedDB';

export interface LearningConfig {
  enabled?: boolean;
  storage?: LearningStorageType;
  retentionDays?: number;
  minSuccessRate?: number;
  maxPatterns?: number;
}

export interface PatternStep {
  action: string;
  parameters: Record<string, unknown>;
  outcome: string;
}

export interface Pattern {
  id: string;
  task: string;
  normalizedTask: string;
  steps: PatternStep[];
  successRate: number;
  averageTime: number;
  lastUsed: number;
  usageCount: number;
}

export interface PatternStorage {
  save(pattern: Pattern): Promise<void>;
  get(id: string): Promise<Pattern | null>;
  list(): Promise<Pattern[]>;
  delete(id: string): Promise<void>;
}

export interface RecordPatternInput {
  task: string;
  steps: PatternStep[];
  result: AgentResult;
  durationMs: number;
}
