# App-Agent

> Application Intelligence Framework - AI agents that understand your entire app

App-Agent is a novel application intelligence framework that enables web applications to have built-in AI agents that understand the entire application context, not just individual pages.

## 🌟 Key Features

- **App State Awareness**: Agent reasons WITH app state, not ABOUT it
- **Workflow-Level Reasoning**: Understands multi-step journeys as single concepts
- **Semantic Entity Registry**: Domain-level understanding (Product, Cart, Order)
- **Multi-Agent Specialization**: Specialized agents for different domains
- **Learned Behavior Loops**: Remembers and optimizes successful patterns

## 🎯 Vision

App-Agent is like a kernel for your application:
- **Built-in**: Integrated into the app, not external
- **Aware**: Understands app state and context
- **Capable**: Can execute complex operations
- **Natural**: Feels like an intelligent assistant
- **Learning**: Gets better with use

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Basic Usage

```typescript
import { AppAgent } from '@app-agent/app-agent'

const agent = new AppAgent({
  getAppState: async () => ({
    currentView: 'shop',
    userRole: 'user',
    cartItems: await getCartItems(),
  }),
  entities: {
    Product: productEntity,
    Cart: cartEntity,
  },
  workflows: {
    checkout: checkoutWorkflow,
  },
})

await agent.execute('Find the best laptop under $1000 and add it to my cart')
```

## 📦 Packages

- **@app-agent/app-agent** - Public facade (recommended import)
- **@app-agent/entities** - Shared domain types
- **@app-agent/core** - Core agent logic and ReAct loop
- **@app-agent/state-manager** - App state integration and tracking
- **@app-agent/semantic-registry** - Runtime entity registry
- **@app-agent/workflow** - Workflow execution and orchestration
- **@app-agent/planner** - Task planning and decomposition
- **@app-agent/tools** - Tool registry and built-in actions
- **@app-agent/llm** - LLM client with prompt optimization
- **@app-agent/memory** - Working, episodic, and semantic memory
- **@app-agent/ui** - Panel components and visual feedback

## 📖 Documentation

- [Architecture](./docs/architecture.md)
- [ADRs](./docs/adr/README.md)
- [Agent Guide](./AGENTS.md)

## 🏗️ Architecture

```
packages/
├── entities/              # Shared domain types (zero deps)
├── semantic-registry/     # Runtime entity registry
├── state-manager/         # App state integration
├── memory/                # Memory system
├── llm/                   # LLM client
├── tools/                 # Tool registry
├── planner/               # Task planning
├── workflow/              # Workflow engine
├── core/                  # ReAct orchestrator
├── ui/                    # Panel components
└── app-agent/             # Public facade
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📄 License

MIT

---

**Status**: In Development 🚧
**Version**: 0.1.0
**Research**: See `/rnd` folder for comprehensive research and planning
