# Page-Agent Research Summary

## Overview
Page-agent is a browser automation framework designed for in-app AI agents using natural language control. Built as a modular monorepo with clear separation of concerns.

## Architecture

### Monorepo Structure
```
packages/
├── llms/                 # LLM client (model-agnostic)
├── page-controller/      # DOM operations (no LLM deps)
├── core/                 # Agent logic (orchestration)
├── ui/                   # Panel components
├── page-agent/          # Main entry point
├── extension/           # Browser extension
├── mcp/                 # MCP server
└── website/            # Documentation
```

### Core Pattern: ReAct Agent Loop
```typescript
while (true) {
  // 1. OBSERVE: Gather environment state
  browserState = await pageController.getBrowserState()

  // 2. THINK: LLM reasoning with reflection-before-action
  result = await llm.invoke(messages, macroTool)

  // 3. ACT: Execute the decided action
  await tool.execute(input, { signal })
}
```

## Key Innovations

### 1. Reflection-Before-Action Mental Model
Enforces structured reasoning through MacroTool:
```typescript
interface MacroToolInput {
  evaluation_previous_goal: string  // What happened last step?
  memory: string                    // What to remember?
  next_goal: string                 // What to achieve next?
  action: Record<string, any>       // The action to take
}
```

### 2. Text-Based DOM Perception
- Live DOM → FlatDomTree → Simplified text representation
- Elements mapped to numeric indexes for targeting
- No screenshots or multi-modal models needed
- Focus on interactive elements (buttons, inputs, links)

### 3. Browser State Representation
```typescript
interface BrowserState {
  url: string
  title: string
  header: string      // Page info + scroll position hint
  content: string     // Simplified HTML of interactive elements
  footer: string      // Scroll position hint for bottom
}
```

### 4. Event System
- **Status Events**: Lifecycle state transitions
- **History Events**: Persistent memory updates
- **Activity Events**: Transient UI feedback
- **Dispose Events**: Cleanup notifications

## Integration Methods

### 1. CDN Integration
```html
<script src="https://cdn.jsdelivr.net/npm/page-agent@1.10.0/dist/iife/page-agent.demo.js"></script>
```

### 2. NPM Integration
```javascript
import { PageAgent } from 'page-agent'

const agent = new PageAgent({
  model: 'qwen3.5-plus',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: 'YOUR_API_KEY',
  language: 'en-US',
})

await agent.execute('Click the login button')
```

### 3. Browser Extension
- Uses RemotePageController for cross-tab operations
- Chrome storage polling for eventual consistency
- Message-passing architecture between side panel and content scripts

## Tool System

### Available Tools
- `done`: Complete task
- `wait`: Wait for specified time
- `ask_user`: Request user input
- `click_element_by_index`: Click interactive element
- `input_text`: Type into input fields
- `select_dropdown_option`: Select from dropdowns
- `scroll`: Vertical scrolling
- `scroll_horizontally`: Horizontal scrolling
- `execute_javascript`: Execute custom JS (experimental)

### Tool Pattern
```typescript
interface PageAgentTool<TParams> {
  description: string
  inputSchema: z.ZodType<TParams>
  execute: (this: PageAgentCore, args: TParams, ctx: ToolContext) => Promise<string>
}
```

## Error Handling

### AutoFixer System
Handles 5+ common LLM response format issues:
- Double JSON stringing fix
- Action name correction
- Primitive coercion (`{"click": 2}` → `{"click": {"index": 2}}`)
- Schema validation with clear error messages
- Fallback to wait action on critical failures

## State Management

### State Layers
```typescript
class PageAgentCore {
  // Persistent state
  task = ''
  taskId = ''
  history: HistoricalEvent[] = []

  // Transient state
  #status: AgentStatus = 'idle'
  #abortController = new AbortController()

  // Internal execution state
  #states = {
    totalWaitTime: 0,
    lastURL: '',
    browserState: null
  }
}
```

### Key Patterns
- Single source of truth: `agent.history`
- Event-driven updates
- Async communication (for remote support)
- AbortSignal propagation

## Success Factors

### Technical Strengths
1. **No Infrastructure**: Pure client-side JavaScript
2. **Text-Based Operation**: Works with any LLM
3. **Bring Your Own LLM**: Flexible model integration
4. **Progressive Enhancement**: Add to existing apps
5. **Visual Feedback**: SimulatorMask for user awareness
6. **Robust Error Handling**: AutoFixer for LLM inconsistencies
7. **Extensible Architecture**: Custom tools and lifecycle hooks

### Design Patterns
1. **MacroTool Pattern**: Enforces structured reasoning
2. **Event-Driven State**: Separates persistent history from transient activity
3. **Async-First Design**: Remote operation support
4. **Source-First Development**: Direct TypeScript imports during development
5. **Lifecycle Hooks**: Extensible customization
6. **Error Recovery**: Response normalization and fallback handling

## Critical Technical Decisions

### DOM Processing Pipeline
1. **Tree Extraction**: Live DOM → FlatDomTree
2. **Dehydration**: DOM tree → simplified text
3. **Indexing**: Elements → numeric indexes
4. **Simplification**: Complex HTML → LLM-consumable format

### Element Interaction System
- Full W3C Pointer Events + UI Events sequence
- Synthetic input events + execCommand fallback
- Element-specific and page-level scrolling
- Native dropdown selection with change events

### Extension Architecture
- Chrome storage polling (not long-lived connections)
- Reliable across extension lifecycle
- Eventually consistent state tracking
- Heart-beat polling for multi-tab workflows

## Lessons for App-Agent

### What to Learn
1. **Separation of Concerns**: DOM, AI, and UI should be independent
2. **Structured Reasoning**: Use schema validation to guide LLM behavior
3. **Plan for Failure**: Build resilient systems that handle model errors
4. **Provide Feedback**: Visual feedback keeps users informed
5. **Stay Modular**: Allow customization without core modifications

### What to Improve
1. **Page-Centric Limitation**: Only sees single page, not entire app
2. **No App State Awareness**: Doesn't understand application context
3. **No Workflow Knowledge**: Doesn't know about multi-step journeys
4. **No Semantic Understanding**: Operates on DOM level, not domain entities
5. **No Learning**: Each session starts fresh, no pattern retention

### Key Architecture Patterns to Adapt
1. **Modular Monorepo**: Clear package boundaries
2. **ReAct Loop**: Observe-Think-Act cycle
3. **Reflection-Before-Action**: Structured reasoning enforcement
4. **Event System**: Clean state management
5. **Tool System**: Extensible action registry
6. **Error Recovery**: Robust fallback handling
