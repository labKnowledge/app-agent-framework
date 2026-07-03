/**
 * Memory System Types
 *
 * Comprehensive memory management for AI agents with working memory,
 * episodic memory, and semantic memory capabilities.
 */

/**
 * Memory entry types
 */
export type MemoryType = 'working' | 'episodic' | 'semantic';

/**
 * Memory entry with metadata
 */
export interface MemoryEntry {
  /** Unique identifier */
  id: string;
  /** Type of memory */
  type: MemoryType;
  /** Timestamp when memory was created */
  timestamp: number;
  /** Last access time */
  lastAccessed: number;
  /** Access frequency */
  accessCount: number;
  /** Memory content */
  content: MemoryContent;
  /** Importance score (0-1) */
  importance: number;
  /** Associated tags for retrieval */
  tags: string[];
  /** Expiration time (optional) */
  expiresAt?: number;
}

/**
 * Memory content based on type
 */
export type MemoryContent = WorkingMemory | EpisodicMemory | SemanticMemory;

/**
 * Working memory - Current task context
 */
export interface WorkingMemory {
  type: 'working';
  /** Current task being executed */
  currentTask: string;
  /** Current goal */
  currentGoal: string;
  /** Recent observations */
  recentObservations: Observation[];
  /** Recent actions taken */
  recentActions: Action[];
  /** Context variables */
  context: Record<string, unknown>;
  /** Temporary state */
  temporaryState: Record<string, unknown>;
}

/**
 * Observation from environment
 */
export interface Observation {
  timestamp: number;
  type: 'dom' | 'state' | 'user' | 'system';
  data: unknown;
  importance: number;
}

/**
 * Action taken by agent
 */
export interface Action {
  timestamp: number;
  type: string;
  parameters: Record<string, unknown>;
  result: unknown;
  success: boolean;
}

/**
 * Episodic memory - Past experiences
 */
export interface EpisodicMemory {
  type: 'episodic';
  /** Task that was performed */
  task: string;
  /** Sequence of actions taken */
  actions: Action[];
  /** Final outcome */
  outcome: 'success' | 'failure' | 'partial';
  /** Lessons learned */
  lessons: string[];
  /** Duration in milliseconds */
  duration: number;
  /** Associated context */
  context: Record<string, unknown>;
  /** Related memories */
  relatedMemories: string[];
}

/**
 * Semantic memory - Learned knowledge
 */
export interface SemanticMemory {
  type: 'semantic';
  /** Knowledge/fact */
  fact: string;
  /** Confidence level (0-1) */
  confidence: number;
  /** Source of knowledge */
  source: 'observation' | 'interaction' | 'inference' | 'user_provided';
  /** Evidence supporting this knowledge */
  evidence: string[];
  /** Contradicting evidence */
  contradictions: string[];
  /** Applicability conditions */
  conditions: string[];
}

/**
 * Memory query for retrieval
 */
export interface MemoryQuery {
  /** Type of memory to search */
  type?: MemoryType | MemoryType[];
  /** Search terms */
  terms?: string[];
  /** Tags to match */
  tags?: string[];
  /** Time range */
  timeRange?: { start: number; end: number };
  /** Minimum importance */
  minImportance?: number;
  /** Maximum results */
  maxResults?: number;
  /** Relevance threshold */
  relevanceThreshold?: number;
}

/**
 * Memory search result
 */
export interface MemoryResult {
  /** Memory entry */
  memory: MemoryEntry;
  /** Relevance score (0-1) */
  relevance: number;
  /** Match reason */
  reason: string;
}

/**
 * Memory consolidation config
 */
export interface MemoryConsolidationConfig {
  /** Working memory retention time (ms) */
  workingMemoryRetention: number;
  /** Episodic memory consolidation interval (ms) */
  consolidationInterval: number;
  /** Maximum episodic memories */
  maxEpisodicMemories: number;
  /** Importance threshold for long-term storage */
  importanceThreshold: number;
  /** Memory compression enabled */
  enableCompression: boolean;
}

/**
 * Memory manager config
 */
export interface MemoryManagerConfig {
  maxWorkingMemory?: number;
  maxEpisodicMemory?: number;
  maxSemanticMemory?: number;
  consolidation?: Partial<MemoryConsolidationConfig>;
  embeddingModel?: string;
  enablePersistence?: boolean;
  persistenceKey?: string;
  storage?: import('@app-agent/entities').StoragePort;
}

/**
 * Memory statistics
 */
export interface MemoryStats {
  /** Total memories by type */
  totalByType: Record<MemoryType, number>;
  /** Average importance by type */
  avgImportance: Record<MemoryType, number>;
  /** Most accessed memories */
  mostAccessed: Array<{ id: string; accessCount: number }>;
  /** Memory usage (bytes if available) */
  memoryUsage: number;
  /** Consolidation statistics */
  consolidation: {
    totalConsolidated: number;
    lastConsolidation: number;
    compressionRatio: number;
  };
}
