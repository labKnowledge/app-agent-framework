# @gakwaya/tools

Advanced tool system with composition, discovery, caching, and enhanced execution capabilities for AI agents.

## Features

- **Tool Composition** - Combine multiple tools into complex workflows
- **Tool Discovery** - Smart tool search and recommendation
- **Result Caching** - Cache tool results for performance
- **Batch Execution** - Execute multiple tools efficiently
- **Parameter Validation** - Zod schema validation for all tools
- **Metrics Collection** - Track tool usage and performance
- **Error Recovery** - Retry logic and error handling
- **Timeout Control** - Configurable timeouts per tool

## Installation

```bash
pnpm add @gakwaya/tools
```

## Usage

### Basic Tool Registration

```typescript
import { ToolRegistry } from '@gakwaya/tools';
import { z } from 'zod';

const registry = new ToolRegistry({
  enableCaching: true,
  enableMetrics: true,
  defaultTimeout: 30000,
});

// Define a tool
const navigateTool = {
  id: 'navigate',
  name: 'Navigate',
  description: 'Navigate to a specific path in the application',
  category: 'navigation' as const,
  inputSchema: z.object({
    path: z.string().describe('The path to navigate to'),
  }),
  execute: async (params, context) => {
    // Navigation logic
    window.location.href = params.path;
    return { navigated: true, path: params.path };
  },
  metadata: {
    tags: ['navigation', 'routing'],
    examples: [
      {
        description: 'Navigate to home',
        parameters: { path: '/' },
        result: { navigated: true, path: '/' },
      },
    ],
    capabilities: ['client-side-navigation', 'url-manipulation'],
    riskLevel: 'low' as const,
  },
  options: {
    timeout: 5000,
    caching: {
      enabled: true,
      ttl: 60000,
      maxSize: 50,
    },
  },
};

// Register the tool
registry.registerTool(navigateTool);

// Execute the tool
const result = await registry.executeTool('navigate', { path: '/dashboard' }, context);
```

### Tool Composition

```typescript
// Register a composition that combines multiple tools
const checkoutComposition = {
  id: 'checkout-flow',
  name: 'Checkout Flow',
  description: 'Complete checkout process with multiple steps',
  tools: [
    {
      toolId: 'navigate-to-cart',
      parameters: { path: '/cart' },
    },
    {
      toolId: 'verify-items',
      parameters: {},
    },
    {
      toolId: 'proceed-checkout',
      parameters: {},
    },
    {
      toolId: 'complete-payment',
      parameters: {},
    },
  ],
  strategy: 'sequential' as const,
  errorHandling: 'stop' as const,
};

registry.registerComposition(checkoutComposition);

// Execute the composition
const results = await registry.executeComposition('checkout-flow', {}, context);
```

### Batch Execution

```typescript
// Execute multiple tools at once
const batch = {
  batchId: 'batch-1',
  executions: [
    { toolId: 'extract-price', parameters: { selector: '.price' } },
    { toolId: 'extract-title', parameters: { selector: '.title' } },
    { toolId: 'extract-availability', parameters: { selector: '.stock' } },
  ],
  mode: 'parallel' as const,
  errorHandling: 'continue' as const,
};

const batchResult = await registry.executeBatch(batch);
console.log('Extracted data:', batchResult.results);
```

### Tool Discovery

```typescript
// Discover tools based on capabilities
const query = {
  terms: ['form', 'fill'],
  categories: ['interaction'] as const,
  capabilities: ['input-text', 'form-submission'],
  maxRiskLevel: 'medium' as const,
};

const discovery = registry.discoverTools(query);
console.log('Relevant tools:', discovery.tools);
console.log('Relevance scores:', discovery.scores);
```

### Tool Metrics

```typescript
// Get metrics for all tools
const allMetrics = registry.getMetrics();
console.log('Tool performance:', allMetrics);

// Get metrics for specific tool
const toolMetrics = registry.getMetrics('navigate');
console.log('Navigate tool stats:', {
  totalCalls: toolMetrics.totalCalls,
  successRate: toolMetrics.successfulCalls / toolMetrics.totalCalls,
  avgDuration: toolMetrics.avgDuration,
  cacheHitRate: toolMetrics.cacheHitRate,
});
```

## Tool Categories

### Navigation

- Page/view navigation
- URL manipulation
- Back/forward navigation

### Interaction

- Element clicking
- Form filling
- Text input
- Dropdown selection

### Extraction

- Text extraction
- Data parsing
- Element information
- Attribute extraction

### Manipulation

- DOM modification
- Data transformation
- Variable updates

### Verification

- Result validation
- Condition checking
- State verification

### Utility

- Wait/delay
- Logging
- Helper functions

### Composite

- Multi-step workflows
- Tool chains
- Complex operations

## Advanced Features

### Result Caching

Tools can cache their results for improved performance:

```typescript
const cachedTool = {
  id: 'get-user-info',
  name: 'Get User Info',
  // ... other properties
  options: {
    caching: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 100,
    },
  },
};

// First call executes the tool
const result1 = await registry.executeTool('get-user-info', { userId: '123' }, context);

// Second call returns cached result (within TTL)
const result2 = await registry.executeTool('get-user-info', { userId: '123' }, context);
```

### Error Recovery

Configure retry logic for flaky tools:

```typescript
const resilientTool = {
  id: 'api-call',
  name: 'API Call',
  // ... other properties
  options: {
    retry: {
      maxAttempts: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      retryableErrors: ['ETIMEDOUT', 'ECONNREFUSED'],
    },
  },
};
```

### Tool Discovery with Smart Matching

The registry can recommend tools based on:

- Search terms (name, description)
- Category matching
- Capability matching
- Tag matching
- Risk level filtering

```typescript
// Find tools for form interaction
const formTools = registry.discoverTools({
  terms: ['form', 'input', 'submit'],
  capabilities: ['form-filling', 'form-submission'],
  categories: ['interaction'],
  maxRiskLevel: 'low',
});
```

### Batch Execution Modes

#### Sequential Mode

Execute tools one after another:

```typescript
const batch = {
  mode: 'sequential' as const,
  executions: [...],
  errorHandling: 'stop' as const,
};
```

#### Parallel Mode

Execute tools simultaneously:

```typescript
const batch = {
  mode: 'parallel' as const,
  executions: [...],
  errorHandling: 'collect' as const,
};
```

## API

### ToolRegistry

#### Constructor

```typescript
new ToolRegistry(config?: ToolRegistryConfig)
```

#### Methods

- `registerTool(tool)` - Register a tool
- `unregisterTool(toolId)` - Unregister a tool
- `getTool(toolId)` - Get tool by ID
- `getAllTools()` - Get all registered tools
- `getToolsByCategory(category)` - Get tools by category
- `discoverTools(query)` - Discover tools based on query
- `executeTool(toolId, params, context)` - Execute a tool
- `executeBatch(batch)` - Execute batch of tools
- `registerComposition(composition)` - Register tool composition
- `executeComposition(compositionId, params, context)` - Execute composition
- `getMetrics(toolId?)` - Get tool metrics
- `clearCache(toolId?)` - Clear tool cache
- `dispose()` - Dispose of registry

#### Events

- `tool_registered` - Tool registered
- `tool_unregistered` - Tool unregistered
- `tool_executed` - Tool execution completed
- `composition_registered` - Composition registered

## Tool Definition Structure

```typescript
interface Tool<TParams, TResult> {
  id: string; // Unique identifier
  name: string; // Display name
  description: string; // What the tool does
  category: ToolCategory; // Tool category
  inputSchema: z.ZodType<TParams>; // Parameter validation
  outputSchema?: z.ZodType<TResult>; // Result validation
  execute: (params: TParams, context: ToolContext) => Promise<TResult>;
  metadata: {
    tags: string[];
    examples: ToolExample[];
    capabilities: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  options?: {
    timeout?: number;
    retry?: RetryConfig;
    caching?: CachingConfig;
  };
}
```

## Configuration

### ToolRegistryConfig

```typescript
interface ToolRegistryConfig {
  autoDiscover?: boolean; // Auto-discover tools (default: true)
  enableCaching?: boolean; // Enable result caching (default: true)
  defaultTimeout?: number; // Default timeout in ms (default: 30000)
  enableMetrics?: boolean; // Enable metrics collection (default: true)
  maxCacheSize?: number; // Max cache entries (default: 100)
  cacheTTL?: number; // Cache TTL in ms (default: 300000)
}
```

## Best Practices

### Tool Design

1. **Clear Descriptions** - Help discovery system match tools
2. **Proper Categories** - Enable better organization
3. **Schema Validation** - Use Zod for type safety
4. **Error Handling** - Return meaningful error messages
5. **Examples** - Provide usage examples

### Performance

1. **Enable Caching** - For expensive operations
2. **Batch Operations** - Combine related calls
3. **Appropriate Timeouts** - Balance responsiveness and reliability
4. **Monitor Metrics** - Track performance and optimize

### Security

1. **Risk Levels** - Mark tools appropriately
2. **Input Validation** - Strict schema validation
3. **Rate Limiting** - Prevent abuse
4. **Permissions** - Require specific permissions

## License

MIT
