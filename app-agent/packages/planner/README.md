# @app-agent/planner

Intelligent task planning and decomposition system for AI agents. Breaks complex user requests into executable sub-tasks with dependency management, adaptive replanning, and execution tracking.

## Features

- **Intelligent Decomposition** - Breaks complex tasks into manageable sub-tasks
- **Dependency Management** - Handles sequential, parallel, and conditional dependencies
- **Adaptive Replanning** - Automatically adjusts plans when facing failures or blocks
- **Execution Tracking** - Monitors progress and handles retries
- **Priority Management** - Optimizes task execution order
- **Few-Shot Learning** - Uses examples for better planning

## Installation

```bash
pnpm add @app-agent/planner
```

## Usage

```typescript
import { TaskPlanner } from '@app-agent/planner';

const planner = new TaskPlanner({
  maxDepth: 5,
  enableReplanning: true,
  strategy: 'adaptive',
});

// Create a plan from user request
const result = await planner.createPlan(
  'Find the best laptop under $1000 and add it to cart',
  {
    appState: { /* current app state */ },
    availableTools: ['navigate', 'click', 'input', 'observe', 'extract'],
    constraints: [
      { type: 'time', description: 'Complete within 2 minutes', value: 120000 }
    ],
    preferences: {
      speed: 'normal',
      riskTolerance: 'medium',
      verification: 'normal',
    },
  },
  async (prompt) => {
    // LLM function for planning
    return await llm.generate(prompt);
  }
);

// Execute plan
let task;
while ((task = planner.getNextTask())) && !planner.isPlanComplete()) {
  try {
    // Execute task
    await executeTask(task);

    // Mark as complete
    planner.completeTask(task.id);
  } catch (error) {
    // Handle failure
    planner.failTask(task.id, error);
  }
}

// Get execution state
const state = planner.getExecutionState();
console.log(`Progress: ${(state.progress * 100).toFixed(0)}%`);
```

## Architecture

### Task Types

1. **observation** - Observe environment/state
2. **navigation** - Navigate to location/view
3. **interaction** - Interact with elements
4. **extraction** - Extract information
5. **verification** - Verify results
6. **decision** - Make decisions
7. **compound** - Complex tasks with sub-tasks

### Planning Process

1. **Analysis** - Understand user request and context
2. **Decomposition** - Break down into sub-tasks
3. **Dependency Mapping** - Establish task relationships
4. **Optimization** - Improve plan efficiency
5. **Validation** - Verify plan feasibility

### Execution Strategies

- **Sequential** - Execute tasks one by one
- **Parallel** - Execute independent tasks simultaneously
- **Adaptive** - Dynamically adjust based on execution results

## API

### TaskPlanner

#### Constructor

```typescript
new TaskPlanner(config?: PlannerConfig)
```

#### Methods

- `createPlan(request, context, llmFn)` - Create execution plan
- `getNextTask()` - Get next task to execute
- `completeTask(taskId, result)` - Mark task as complete
- `failTask(taskId, error)` - Mark task as failed
- `blockTask(taskId, reason)` - Mark task as blocked
- `getExecutionState()` - Get current execution state
- `getCurrentPlan()` - Get current plan
- `isPlanComplete()` - Check if plan is complete
- `reset()` - Reset planner state

## Configuration

### PlannerConfig

```typescript
interface PlannerConfig {
  maxDepth?: number; // Maximum planning depth (default: 5)
  maxSubTasks?: number; // Maximum sub-tasks per task (default: 10)
  planningTimeout?: number; // Planning timeout in ms (default: 30000)
  enableReplanning?: boolean; // Enable adaptive replanning (default: true)
  maxReplanningAttempts?: number; // Maximum replanning attempts (default: 3)
  useFewShot?: boolean; // Use few-shot examples (default: true)
  strategy?: 'hierarchical' | 'linear' | 'adaptive'; // Planning strategy (default: 'adaptive')
}
```

## Examples

### Simple Navigation Task

```typescript
const plan = await planner.createPlan('Go to settings and change theme to dark', context, llmFn);

// Generates tasks like:
// 1. Navigate to settings
// 2. Find theme selector
// 3. Select dark theme
// 4. Verify change
```

### Complex Multi-Step Task

```typescript
const plan = await planner.createPlan(
  'Find best laptop under $1000, compare specs, and add to cart',
  context,
  llmFn
);

// Generates complex plan with:
// - Multiple observation tasks
// - Filtering and comparison
// - Decision making
// - Verification steps
// - Parallel execution opportunities
```

### Error Recovery

```typescript
// When a task fails, planner automatically:
// 1. Logs the failure
// 2. Checks retry configuration
// 3. Replans if necessary
// 4. Updates execution strategy

planner.failTask('task-3', new Error('Element not found'));

// Planner will:
// - Retry if attempts remain
// - Replan if max retries exceeded
// - Adjust subsequent tasks
```

## License

MIT
