# @gakwaya/workflow

Advanced workflow orchestration engine for executing complex multi-step processes with state management, parallel execution, and error recovery.

## Features

- **Complex Step Types** - Action, sequence, parallel, branch, loop, wait, trigger, subtask, compensation
- **State Management** - Full workflow state tracking with checkpoints and persistence
- **Parallel Execution** - Execute independent steps concurrently
- **Error Recovery** - Retry, compensation, and fallback strategies
- **Conditional Branching** - Dynamic workflow paths based on conditions
- **Loop Iteration** - Repeat steps with iteration control
- **Event System** - Comprehensive workflow event emission
- **Workflow Templates** - Reusable workflow definitions

## Installation

```bash
pnpm add @gakwaya/workflow
```

## Usage

### Basic Workflow Execution

```typescript
import { WorkflowEngine } from '@gakwaya/workflow';

const engine = new WorkflowEngine({
  maxConcurrentWorkflows: 5,
  enablePersistence: true,
  checkpointInterval: 10000,
});

// Define a workflow
const workflow = {
  id: 'checkout-workflow',
  name: 'E-commerce Checkout',
  description: 'Complete purchase process',
  version: '1.0.0',
  steps: [
    {
      id: 'navigate-to-cart',
      name: 'Navigate to Cart',
      type: 'action',
      action: {
        type: 'tool',
        toolName: 'navigate',
        parameters: { path: '/cart' },
      },
    },
    {
      id: 'verify-items',
      name: 'Verify Cart Items',
      type: 'action',
      action: {
        type: 'tool',
        toolName: 'extract',
        parameters: { selector: '.cart-item' },
      },
      dependencies: ['navigate-to-cart'],
    },
    {
      id: 'proceed-checkout',
      name: 'Proceed to Checkout',
      type: 'action',
      action: {
        type: 'tool',
        toolName: 'click',
        parameters: { selector: '#checkout-button' },
      },
      dependencies: ['verify-items'],
      allowParallel: false,
    },
  ],
  variables: [
    { name: 'cartTotal', type: 'number', required: false },
    { name: 'itemCount', type: 'number', required: false },
  ],
  errorStrategy: 'stop',
  options: {
    enableCheckpoints: true,
    enableParallel: true,
    maxParallelSteps: 3,
  },
  metadata: {
    category: 'ecommerce',
    tags: ['checkout', 'purchase'],
  },
};

// Register workflow
engine.registerWorkflow(workflow);

// Start execution
const executionId = await engine.startExecution('checkout-workflow', {
  cartTotal: 0,
  itemCount: 0,
});

// Monitor execution
engine.on('workflow_event', (event) => {
  console.log('Workflow event:', event.eventType, event.data);
});

// Get execution status
const execution = engine.getExecution(executionId);
console.log('Status:', execution?.status);
console.log('Progress:', execution?.completedSteps.length, '/', workflow.steps.length);
```

### Advanced Workflow Features

#### Conditional Branching

```typescript
const conditionalWorkflow = {
  id: 'conditional-workflow',
  name: 'Conditional Path Selection',
  steps: [
    {
      id: 'check-user-status',
      name: 'Check User Status',
      type: 'action',
      action: {
        type: 'tool',
        toolName: 'extract',
        parameters: { selector: '.user-status' },
      },
    },
    {
      id: 'branch-path',
      name: 'Choose Path',
      type: 'action',
      action: {
        type: 'conditional',
        branches: [
          {
            condition: '$userStatus === "premium"',
            action: {
              type: 'tool',
              toolName: 'navigate',
              parameters: { path: '/premium/features' },
            },
          },
          {
            condition: '$userStatus === "free"',
            action: {
              type: 'tool',
              toolName: 'navigate',
              parameters: { path: '/upgrade' },
            },
          },
        ],
        default: {
          type: 'tool',
          toolName: 'navigate',
          parameters: { path: '/dashboard' },
        },
      },
      dependencies: ['check-user-status'],
    },
  ],
  // ... rest of workflow definition
};
```

#### Loop Execution

```typescript
const loopWorkflow = {
  id: 'batch-processing',
  name: 'Batch Process Items',
  steps: [
    {
      id: 'process-items',
      name: 'Process All Items',
      type: 'action',
      action: {
        type: 'loop',
        iterations: 10,
        loopVariable: 'itemIndex',
        body: {
          type: 'tool',
          toolName: 'processItem',
          parameters: {
            index: '$itemIndex',
          },
        },
      },
    },
  ],
  // ... rest of workflow definition
};
```

#### Parallel Execution

```typescript
const parallelWorkflow = {
  id: 'parallel-tasks',
  name: 'Execute Independent Tasks',
  steps: [
    {
      id: 'task-1',
      name: 'Independent Task 1',
      type: 'action',
      action: {
        type: 'tool',
        toolName: 'task1',
        parameters: {},
      },
      allowParallel: true,
    },
    {
      id: 'task-2',
      name: 'Independent Task 2',
      type: 'action',
      action: {
        type: 'tool',
        toolName: 'task2',
        parameters: {},
      },
      allowParallel: true,
    },
    {
      id: 'task-3',
      name: 'Dependent Task',
      type: 'action',
      action: {
        type: 'tool',
        toolName: 'task3',
        parameters: {},
      },
      dependencies: ['task-1', 'task-2'],
      allowParallel: false,
    },
  ],
  // ... rest of workflow definition
};
```

#### Error Handling with Retry

```typescript
const resilientWorkflow = {
  id: 'resilient-workflow',
  name: 'Workflow with Error Recovery',
  steps: [
    {
      id: 'risky-operation',
      name: 'Risky Operation',
      type: 'action',
      action: {
        type: 'tool',
        toolName: 'riskyOperation',
        parameters: {},
      },
      retry: {
        maxAttempts: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      onError: {
        strategy: 'retry',
        maxRetries: 3,
        retryDelay: 1000,
      },
    },
  ],
  errorStrategy: 'continue',
  // ... rest of workflow definition
};
```

### Workflow Templates

```typescript
const checkoutTemplate = {
  templateId: 'checkout-template',
  name: 'Checkout Template',
  description: 'Standard e-commerce checkout process',
  category: 'ecommerce',
  parameters: [
    { name: 'productId', type: 'string', required: true },
    { name: 'quantity', type: 'number', required: false, defaultValue: 1 },
  ],
  workflow: {
    name: 'Dynamic Checkout',
    description: 'Checkout with dynamic product',
    version: '1.0.0',
    steps: [
      {
        id: 'add-to-cart',
        name: 'Add Product to Cart',
        type: 'action',
        action: {
          type: 'tool',
          toolName: 'addToCart',
          parameters: {
            productId: '$productId',
            quantity: '$quantity',
          },
        },
      },
      // ... rest of steps
    ],
    variables: [],
    errorStrategy: 'stop',
    options: {},
    metadata: {},
  },
};

// Create workflow from template
const workflow = engine.createFromTemplate(checkoutTemplate, {
  productId: 'prod-123',
  quantity: 2,
});
```

## API

### WorkflowEngine

#### Constructor

```typescript
new WorkflowEngine(config?: WorkflowEngineConfig)
```

#### Methods

- `registerWorkflow(workflow)` - Register workflow definition
- `getWorkflow(id)` - Get workflow by ID
- `createFromTemplate(template, parameters)` - Create workflow from template
- `startExecution(workflowId, inputVariables)` - Start workflow execution
- `getExecution(executionId)` - Get execution state
- `pauseExecution(executionId)` - Pause execution
- `resumeExecution(executionId)` - Resume execution
- `cancelExecution(executionId)` - Cancel execution
- `getExecutionHistory(executionId)` - Get execution history
- `dispose()` - Dispose of engine

#### Events

- `workflow_event` - All workflow events
  - `started` - Workflow started
  - `completed` - Workflow completed
  - `failed` - Workflow failed
  - `paused` - Workflow paused
  - `resumed` - Workflow resumed
  - `step_started` - Step started
  - `step_completed` - Step completed
  - `step_failed` - Step failed
  - `checkpoint` - Checkpoint created
- `tool_execution` - Tool execution request (for agent integration)

## Configuration

### WorkflowEngineConfig

```typescript
interface WorkflowEngineConfig {
  maxConcurrentWorkflows?: number; // Max concurrent executions (default: 5)
  defaultTimeout?: number; // Default timeout in ms (default: 300000)
  enablePersistence?: boolean; // Enable localStorage persistence (default: false)
  persistenceKey?: string; // Persistence key (default: 'workflow-engine')
  checkpointInterval?: number; // Checkpoint interval in ms (default: 10000)
  enableMetrics?: boolean; // Enable metrics collection (default: true)
}
```

## Step Types

### Action Step

Execute single tool or action

### Sequence Step

Execute steps in order

### Parallel Step

Execute steps concurrently

### Branch Step

Conditional execution based on conditions

### Loop Step

Iterative execution with condition or count

### Wait Step

Wait for duration or condition

### Trigger Step

Emit event or callback

### Subtask Step

Execute nested workflow

### Compensation Step

Undo previous actions (transactional compensation)

## Error Strategies

### Stop

Halt workflow on first error

### Continue

Skip failed step and continue

### Retry

Retry failed step with backoff

### Compensate

Run compensation transactions

## Use Cases

### E-commerce Checkout

- Add items to cart
- Verify inventory
- Calculate totals
- Process payment
- Confirm order

### Form Automation

- Navigate to form
- Fill fields
- Validate input
- Submit form
- Verify submission

### Data Processing

- Extract data
- Transform data
- Validate data
- Store results
- Generate report

### Multi-Page Workflows

- Navigate through pages
- Extract information
- Make decisions
- Perform actions
- Verify completion

## License

MIT
