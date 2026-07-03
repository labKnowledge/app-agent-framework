# @gakwaya/llm

Enhanced LLM integration package with advanced prompting, streaming support, cost tracking, and context management.

## Features

- **Advanced Prompting** - Few-shot learning, chain-of-thought, template management
- **Streaming Responses** - Real-time response streaming
- **Cost Tracking** - Monitor token usage and costs
- **Context Management** - Smart conversation history handling
- **Prompt Optimization** - Automatic compression and summarization
- **Retry Logic** - Configurable retry with exponential backoff
- **Multi-turn Conversations** - Conversation history management

## Installation

```bash
pnpm add @gakwaya/llm
```

## Usage

### Basic Completion

```typescript
import { EnhancedLLMClient } from '@gakwaya/llm';

const client = new EnhancedLLMClient({
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
  apiKey: 'your-api-key',
  timeout: 60000,
});

const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is the capital of France?' },
];

const response = await client.complete(messages);
console.log(response.message.content);
```

### Streaming Responses

```typescript
const response = await client.stream(messages, { temperature: 0.7 }, (chunk) => {
  process.stdout.write(chunk.content);
  if (chunk.done) {
    console.log('\n[Stream completed]');
  }
});
```

### Prompt Templates

```typescript
// Register a prompt template
client.registerTemplate({
  id: 'task-planning',
  name: 'Task Planning Template',
  description: 'Template for planning complex tasks',
  content: `You are an expert task planner. Your goal is to: {{goal}}

Available tools: {{tools}}

Constraints: {{constraints}}

Break down the task into executable steps.`,
  variables: [
    { name: 'goal', required: true, description: 'Main objective' },
    { name: 'tools', required: true, description: 'Available tools' },
    { name: 'constraints', required: false, description: 'Task constraints' },
  ],
  examples: [
    {
      input: { goal: 'Checkout process', tools: ['click', 'input'] },
      output: 'Step 1: Navigate to cart\nStep 2: Verify items\n...',
    },
  ],
});

// Use template
const response = await client.useTemplate('task-planning', {
  goal: 'Complete user registration',
  tools: 'navigate, click, input, verify',
  constraints: 'Must complete within 2 minutes',
});
```

### Context Management

```typescript
// Set context management strategy
client.setContextManagement({
  maxTokens: 128000,
  strategy: 'summarize',
  priorities: {
    system: 100,
    user: 90,
    assistant: 70,
  },
  summarizeThreshold: 0.8,
});

// Clear conversation history
client.clearContext();

// Get conversation history
const history = client.getHistory();
```

### Cost Tracking

```typescript
// Get cost statistics
const costs = client.getCosts();
console.log('Total cost:', costs.totalCost);
console.log('Total tokens:', costs.tokenUsage.totalTokens);
console.log('Requests:', costs.requestCount);
console.log('Cost by model:', costs.costByModel);
```

## Advanced Features

### Prompt Optimization

```typescript
const response = await client.complete(messages, {
  enableCompression: true,
  maxTokens: 2000,
  temperature: 0.7,
  topP: 0.9,
  frequencyPenalty: 0.5,
  presencePenalty: 0.5,
  stopSequences: ['END', 'DONE'],
});
```

### Chain-of-Thought Reasoning

```typescript
const cotTemplate = {
  id: 'cot-template',
  name: 'Chain of Thought Template',
  content: `Let's think step by step to solve: {{problem}}

Step 1: Understand the problem
Step 2: Break it down
Step 3: Solve step by step
Step 4: Verify the solution`,
  variables: [{ name: 'problem', required: true }],
};

client.registerTemplate(cotTemplate);
```

### Few-Shot Learning

```typescript
const fewShotTemplate = {
  id: 'few-shot-template',
  name: 'Few-Shot Example',
  content: `Based on these examples, solve the following:

{{examples}}

Now solve: {{input}}`,
  variables: [
    { name: 'examples', required: true },
    { name: 'input', required: true },
  ],
  examples: [
    {
      input: { task: 'Click button', selector: '#submit' },
      output: 'Tool: click\nParameters: { selector: "#submit" }',
    },
    {
      input: { task: 'Enter text', selector: '#name', text: 'John' },
      output: 'Tool: input\nParameters: { selector: "#name", text: "John" }',
    },
  ],
};
```

### Streaming with Progress

```typescript
let fullContent = '';

const response = await client.stream(messages, {}, (chunk) => {
  fullContent += chunk.content;
  console.log(`Received: ${chunk.content.length} chars`);
  console.log(`Progress: ${chunk.timing?.currentTime || 0}ms`);

  if (chunk.done) {
    console.log('Streaming complete!');
    console.log(`Total duration: ${chunk.timing?.currentTime}ms`);
  }
});
```

## Context Management Strategies

### Truncate (Default)

- Keeps most recent messages within token limit
- Prioritizes by role priority
- Simple and fast

### Compress

- Compresses message content
- Removes redundant phrases
- Maintains full history

### Summarize

- Summarizes older messages
- Keeps recent messages intact
- Balances context and cost

## API

### EnhancedLLMClient

#### Constructor

```typescript
new EnhancedLLMClient(config: LLMClientConfig)
```

#### Methods

- `complete(messages, options?)` - Send completion request
- `stream(messages, options?, onChunk?)` - Stream completion request
- `useTemplate(templateId, variables, options?)` - Use prompt template
- `registerTemplate(template)` - Register prompt template
- `getCosts()` - Get cost tracking statistics
- `clearContext()` - Clear conversation history
- `setContextManagement(config)` - Set context management strategy
- `getHistory()` - Get conversation history

#### Events

- Emitted via EventEmitter for extensibility

## Configuration

### LLMClientConfig

```typescript
interface LLMClientConfig {
  baseURL: string; // API base URL
  model: string; // Model identifier
  apiKey?: string; // API key
  timeout?: number; // Request timeout (default: 60000)
  maxRetries?: number; // Max retry attempts (default: 3)
  retryDelay?: number; // Retry delay in ms (default: 1000)
  organizationId?: string; // Organization ID
}
```

### PromptOptimization

```typescript
interface PromptOptimization {
  enableCompression?: boolean; // Enable prompt compression
  maxTokens?: number; // Max response tokens
  temperature?: number; // Response temperature (0-1)
  topP?: number; // Top P sampling (0-1)
  frequencyPenalty?: number; // Frequency penalty (-2 to 2)
  presencePenalty?: number; // Presence penalty (-2 to 2)
  stopSequences?: string[]; // Stop sequences
}
```

### ContextManagement

```typescript
interface ContextManagement {
  maxTokens: number; // Max context tokens (default: 128000)
  strategy: 'truncate' | 'compress' | 'summarize';
  priorities: Record<string, number>; // Message priority by role
  summarizeThreshold: number; // When to summarize (0-1)
}
```

## Best Practices

### Cost Optimization

1. **Enable Compression** - Reduce token usage
2. **Use Templates** - Reuse prompt structures
3. **Monitor Costs** - Track spending regularly
4. **Context Management** - Keep history efficient

### Performance

1. **Streaming** - For faster response times
2. **Caching** - Cache template responses
3. **Batch Requests** - Combine when possible
4. **Appropriate Timeouts** - Balance reliability and speed

### Quality

1. **Few-Shot Learning** - Improve accuracy
2. **Chain-of-Thought** - Better reasoning
3. **Clear Instructions** - Better responses
4. **Examples** - Show expected format

## Cost Tracking Examples

```typescript
// Monitor costs in real-time
const costs = client.getCosts();
console.log(`Total spent: $${costs.totalCost.toFixed(4)}`);
console.log(`Total tokens: ${costs.tokenUsage.totalTokens.toLocaleString()}`);
console.log(`Average cost per request: $${(costs.totalCost / costs.requestCount).toFixed(6)}`);

// Track costs by model
for (const [model, cost] of Object.entries(costs.costByModel)) {
  console.log(`${model}: $${cost.toFixed(4)}`);
}
```

## Streaming Example

```typescript
// Create typing effect
async function typeResponse(text: string) {
  for (const char of text) {
    process.stdout.write(char);
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
}

const response = await client.stream(messages, {}, async (chunk) => {
  if (chunk.content) {
    await typeResponse(chunk.content);
  }
  if (chunk.done) {
    console.log('\n[DONE]');
  }
});
```

## License

MIT
