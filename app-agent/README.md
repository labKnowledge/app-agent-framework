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

- **@app-agent/core** - Core agent logic and ReAct loop
- **@app-agent/state-manager** - App state integration and tracking
- **@app-agent/semantic-registry** - Entity and operation definitions
- **@app-agent/workflow-engine** - Workflow execution and orchestration
- **@app-agent/multi-agent** - Specialized agent coordination
- **@app-agent/learning** - Pattern learning and optimization
- **@app-agent/ui** - Panel components and visual feedback
- **@app-agent/integrations/react** - React integration
- **@app-agent/integrations/vue** - Vue integration
- **@app-agent/integrations/svelte** - Svelte integration
- **@app-agent/app-agent** - Main package

## 📖 Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Architecture](./docs/architecture.md)
- [Guides](./docs/guides/)

## 🏗️ Architecture

```
packages/
├── core/                  # Core agent logic
├── state-manager/         # App state integration
├── semantic-registry/     # Entity/operation definitions
├── workflow-engine/       # Workflow execution
├── multi-agent/          # Agent coordination
├── learning/             # Pattern learning
├── ui/                   # Panel components
├── integrations/         # Framework integrations
└── app-agent/           # Main package
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📄 License

MIT

---

**Status**: In Development 🚧
**Version**: 0.1.0
**Research**: See `/rnd` folder for comprehensive research and planning
