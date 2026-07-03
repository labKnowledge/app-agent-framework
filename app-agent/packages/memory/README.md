# @app-agent/memory

Memory management system for AI agents with comprehensive capabilities for working memory, episodic memory, and semantic memory.

## Features

- **Working Memory** - Short-term context for current tasks
- **Episodic Memory** - Long-term storage of past experiences
- **Semantic Memory** - Learned knowledge and facts
- **Smart Retrieval** - Relevance-based memory search
- **Automatic Consolidation** - Moving from short-term to long-term storage
- **Persistence** - Optional localStorage persistence

## Installation

```bash
pnpm add @app-agent/memory
```

## Usage

```typescript
import { MemoryManager } from '@app-agent/memory';

const memory = new MemoryManager({
  maxWorkingMemory: 50,
  maxEpisodicMemory: 1000,
  maxSemanticMemory: 500,
  enablePersistence: true,
});

// Add working memory
memory.updateWorkingMemory({
  currentTask: 'Navigate to settings',
  currentGoal: 'Change user preferences',
});

// Add observation
memory.addObservation({
  timestamp: Date.now(),
  type: 'dom',
  data: { element: 'button', text: 'Settings' },
  importance: 0.8,
});

// Add action
memory.addAction({
  timestamp: Date.now(),
  type: 'click',
  parameters: { index: 5 },
  result: 'Navigated to settings',
  success: true,
});

// Consolidate episode when task completes
memory.consolidateEpisode('Navigate to settings', 'success');

// Search for relevant memories
const relevant = memory.getRelevantContext('settings preferences');

// Add semantic memory
memory.addSemanticMemory(
  'Settings page contains user preferences',
  0.9,
  'observation',
  ['Found settings page with options']
);

// Get statistics
const stats = memory.getStats();
```

## Architecture

### Memory Types

1. **Working Memory**
   - Current task context
   - Recent observations (last 20)
   - Recent actions (last 10)
   - Temporary state
   - Retention: 5 minutes default

2. **Episodic Memory**
   - Past task executions
   - Action sequences
   - Outcomes and lessons
   - Long-term storage
   - Maximum: 1000 episodes

3. **Semantic Memory**
   - Learned facts
   - Confidence scores
   - Evidence tracking
   - Contradiction detection
   - Maximum: 500 facts

### Memory Consolidation

Working memories are automatically consolidated to episodic memory when:
- Retention time expires (5 minutes)
- Importance threshold is met (0.5 default)
- Task is completed or failed

### Memory Retrieval

Search uses multiple factors for relevance:
- Importance score
- Recency (decays over 24 hours)
- Access frequency
- Term matching
- Tag matching

## API

### MemoryManager

#### Constructor
```typescript
new MemoryManager(config?: MemoryManagerConfig)
```

#### Methods
- `addMemory(type, content, options)` - Add memory entry
- `getMemory(id)` - Get memory by ID
- `searchMemories(query)` - Search memories
- `updateWorkingMemory(updates)` - Update working memory
- `addObservation(observation)` - Add observation
- `addAction(action)` - Add action
- `consolidateEpisode(task, outcome)` - Consolidate to episodic
- `addSemanticMemory(fact, confidence, source)` - Add semantic memory
- `getRelevantContext(query, maxResults)` - Get relevant context
- `getStats()` - Get memory statistics
- `clearAll()` - Clear all memories
- `clearWorkingMemory()` - Clear working memory
- `dispose()` - Dispose of memory manager

## License

MIT
