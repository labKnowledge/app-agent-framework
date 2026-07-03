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
pnpm add @gakwaya/app-agent
# React apps:
pnpm add @gakwaya/integrations-react @gakwaya/ui
```

### Basic Usage

```typescript
import { AppAgent } from '@gakwaya/app-agent';

const agent = new AppAgent({
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
  getAppState: async () => ({
    currentView: 'shop',
    user: { id: '1', role: 'customer', isAuthenticated: true, attributes: {} },
    context: { cartItems: [] },
    timestamp: Date.now(),
  }),
  entities: {
    Product: productEntity,
  },
  workflows: {
    checkout: checkoutWorkflow,
  },
});

await agent.execute('Find the best laptop under $1000 and add it to my cart');
```

### Monorepo development

```bash
cd app-agent
pnpm install
pnpm build
pnpm validate
```

## 📦 Packages

- **@gakwaya/app-agent** - Public facade (recommended import)
- **@gakwaya/entities** - Shared domain types
- **@gakwaya/core** - Core agent logic and ReAct loop
- **@gakwaya/state-manager** - App state integration and tracking
- **@gakwaya/semantic-registry** - Runtime entity registry
- **@gakwaya/workflow** - Workflow execution and orchestration
- **@gakwaya/planner** - Task planning and decomposition
- **@gakwaya/tools** - Tool registry and built-in actions
- **@gakwaya/llm** - LLM client with prompt optimization
- **@gakwaya/memory** - Working, episodic, and semantic memory
- **@gakwaya/ui** - Panel components and visual feedback

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

**Status**: Alpha — published on npm as `@gakwaya/*`
**Version**: 0.1.x
**Research**: See `/rnd` folder for comprehensive research and planning
