# @app-agent/core

Core agent logic for App-Agent - implements the ReAct (Reasoning + Acting) loop with app state awareness.

## Features

- ✅ **ReAct Loop**: Observe-Think-Act cycle
- ✅ **App State Awareness**: Understands application context
- ✅ **Reflection-Before-Action**: Structured reasoning
- ✅ **Event System**: Status, history, activity events
- ✅ **Cooperative Cancellation**: AbortSignal support
- ✅ **LLM Integration**: OpenAI-compatible APIs
- ✅ **Tool System**: Extensible action registry

## Usage

```typescript
import { AppAgentCore } from '@app-agent/core';

const agent = new AppAgentCore({
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
  apiKey: 'your-api-key',
  getAppState: async () => ({
    currentView: 'shop',
    user: {
      id: 'user-123',
      role: 'customer',
      isAuthenticated: true,
    },
    context: {},
    timestamp: Date.now(),
  }),
  maxSteps: 40,
  stepDelay: 400,
});

// Listen to events
agent.on('statuschange', ({ status }) => {
  console.log('Status:', status);
});

agent.on('activity', ({ activity }) => {
  console.log('Activity:', activity);
});

// Execute a task
const result = await agent.execute('Find the best laptop under $1000');

console.log(result.success, result.result, result.steps);

// Clean up
agent.dispose();
```

## API

### AppAgentCore

#### Constructor

```typescript
new AppAgentCore(config: AgentConfig)
```

**AgentConfig:**
- `baseURL`: LLM API base URL
- `model`: Model identifier
- `apiKey`: API key (optional)
- `getAppState`: Callback to get current application state
- `maxSteps`: Maximum steps before giving up (default: 40)
- `stepDelay`: Delay between steps in ms (default: 0)
- `onBeforeStep`: Called before each step
- `onAfterStep`: Called after each step
- `onBeforeTask`: Called before task execution
- `onAfterTask`: Called after task completion
- `onDispose`: Called when agent is disposed

#### Methods

**execute(task: string): Promise<AgentResult>**
- Execute a task with natural language
- Returns result with success status and history

**registerTool(tool: Tool): void**
- Register a custom tool

**unregisterTool(name: string): void**
- Unregister a tool

**getTools(): Map<string, Tool>**
- Get all registered tools

**dispose(): void**
- Clean up agent resources

#### Events

**statuschange**: Emitted when agent status changes
```typescript
agent.on('statuschange', ({ status }) => {
  // status: 'idle' | 'running' | 'waiting' | 'error' | 'completed' | 'disposed'
});
```

**historychange**: Emitted when history is updated
```typescript
agent.on('historychange', ({ history }) => {
  // history: HistoricalEvent[]
});
```

**activity**: Emitted for transient activity updates
```typescript
agent.on('activity', ({ activity }) => {
  // activity: string (e.g., 'Thinking...', 'Executing: click')
});
```

**dispose**: Emitted when agent is disposed
```typescript
agent.on('dispose', () => {
  // Agent cleaned up
});
```

## Architecture

The core agent implements a ReAct loop:

1. **OBSERVE**: Gather current environment state
   - Application state (user, context, preferences)
   - DOM state (URL, title, content)
   - Generate observations/warnings

2. **THINK**: LLM reasoning with reflection-before-action
   - Evaluate previous goal
   - Remember important information
   - Plan next goal
   - Choose action to achieve it

3. **ACT**: Execute the decided action
   - Find and execute tool
   - Handle errors gracefully
   - Return result

## Types

### AgentResult

```typescript
interface AgentResult {
  success: boolean;
  result: string;
  steps: number;
  history: HistoricalEvent[];
  error?: Error;
}
```

### Tool

```typescript
interface Tool<TParams = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TParams>;
  execute: (params: TParams, context: ToolContext) => Promise<string>;
}
```

### AppState

```typescript
interface AppState {
  currentView: string;
  user: UserInfo;
  context: Record<string, unknown>;
  timestamp: number;
}
```

## Built-in Tools

- **done**: Mark task as complete
- **wait**: Wait for specified duration

## License

MIT
