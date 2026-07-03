# App-Agent Visual Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                         │
│  (React, Vue, Svelte, Vanilla JS - Your Web Application)       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Integration
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         APP-AGENT LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React      │  │     Vue      │  │   Svelte     │          │
│  │ Integration  │  │ Integration  │  │ Integration  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                   ┌────────▼────────┐                           │
│                   │  Main Package   │                           │
│                   │   app-agent     │                           │
│                   └────────┬────────┘                           │
│                            │                                     │
│  ┌─────────────────────────┼─────────────────────────┐         │
│  │                         │                         │         │
│  ▼                         ▼                         ▼         │
│ ┌─────────┐          ┌─────────┐          ┌─────────┐          │
│ │  Core   │          │    UI   │          │   LLM   │          │
│ │  Agent  │◄────────►│  Panel  │          │ Client  │          │
│ └────┬────┘          └─────────┘          └─────────┘          │
│      │                                                      │    │
│      │                                                      │    │
│      │ Uses                                                 │    │
│      │                                                      │    │
│  ┌───┴──────────────────────────────────────────────────┐  │    │
│  │                                                       │  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│  │    │
│  │  │   State      │  │   Semantic   │  │  Workflow   ││  │    │
│  │  │  Manager     │  │   Registry   │  │   Engine    ││  │    │
│  │  └──────────────┘  └──────────────┘  └─────────────┘│  │    │
│  │                                                       │  │    │
│  │  ┌──────────────┐  ┌──────────────┐                  │  │    │
│  │  │   Multi-     │  │    Learning  │                  │  │    │
│  │  │    Agent     │  │    System    │                  │  │    │
│  │  │ Coordinator  │  │              │                  │  │    │
│  │  └──────────────┘  └──────────────┘                  │  │    │
│  │                                                       │  │    │
│  └───────────────────────────────────────────────────────┘  │    │
└───────────────────────────────────────────────────────────────┘
                            │
                            │ Observes & Acts
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION STATE                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   User Data    │  │  App Context   │  │  Preferences   │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Interacts With
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          DOM/UI LAYER                            │
│  Buttons, Inputs, Navigation, Modals, Forms, etc.              │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER REQUEST FLOW                            │
└─────────────────────────────────────────────────────────────────┘

1. USER INPUT
   "Find the best laptop under $1000 and add it to my cart"
         │
         ▼
2. OBSERVE PHASE (5 Senses)
   ├── Visual Layer: DOM structure, UI state
   ├── App State Layer: Current view, user role, cart items
   ├── Navigation Layer: Route structure, available workflows
   ├── Semantic Layer: Product entity, Cart entity available
   └── Behavioral Layer: Previous successful patterns
         │
         ▼
3. THINK PHASE (Structured Reasoning)
   ├── Analyze task with app state context
   ├── Identify relevant entities (Product, Cart)
   ├── Select appropriate workflow (search → select → add to cart)
   ├── Delegate to specialized agent (CommerceAgent)
   └── Plan execution steps
         │
         ▼
4. ACT PHASE (Execution)
   ├── Execute workflow steps
   │   ├── Navigate to search
   │   ├── Input search query
   │   ├── Filter by price
   │   ├── Select best product (by rating)
   │   └── Add to cart
   ├── Use semantic entity operations
   │   └── Product.addToCart()
   └── Update app state
         │
         ▼
5. LEARN PHASE (Pattern Recognition)
   ├── Record successful pattern
   ├── Update execution metrics
   ├── Store for future optimization
   └── Improve next time
         │
         ▼
6. RESULT
   ✓ Task completed successfully
   ✓ Cart updated
   ✓ Pattern learned
```

## Multi-Agent Coordination

```
┌─────────────────────────────────────────────────────────────────┐
│                   MULTI-AGENT COORDINATOR                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Incoming Task: "Checkout with PayPal and ship to home"         │
│                                                                   │
│     ┌────────────────┐                                           │
│     │  Task Analyzer │                                           │
│     │  & Router      │                                           │
│     └───────┬────────┘                                           │
│             │                                                    │
│             │ Decomposes task                                   │
│             │                                                    │
│     ┌───────┴──────────┬──────────┬──────────┬──────────┐       │
│     │                  │          │          │          │       │
│     ▼                  ▼          ▼          ▼          ▼       │
│ ┌─────────┐      ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐  │
│ │Commerce │      │ Navigate│ │Payment  │ │Shipping│ │Settings│ │
│ │ Agent   │      │ Agent   │ │ Agent   │ │ Agent  │ │ Agent │  │
│ └────┬────┘      └────┬────┘ └────┬────┘ └────┬────┘ └───┬───┘  │
│      │                │           │           │          │      │
│      │ Execute        │           │           │          │      │
│      │                │           │           │          │      │
│      ▼                ▼           ▼           ▼          ▼      │
│ ┌─────────┐      ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐  │
│ │"Add     │      │"Go to   │ │"Select  │ │"Ship to│ │"Use   │  │
│ │ premium │      │ checkout│ │PayPal  │ │ home"  │ │ home  │  │
│ │ warranty│      │ page"   │ │"       │ │"       │ │ address│  │
│ │ to cart"│      │         │ │         │ │         │ │"      │  │
│ └─────────┘      └─────────┘ └─────────┘ └─────────┘ └───────┘  │
│      │                │           │           │          │      │
│      └────────────────┴───────────┴───────────┴──────────┘      │
│                           │                                      │
│                           │ Coordinate                           │
│                           ▼                                      │
│                    ┌─────────┐                                   │
│                    │ Shared  │                                   │
│                    │ Context│                                   │
│                    └─────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Semantic Entity System

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEMANTIC REGISTRY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Entity: Product                                                  │
│  ├── Attributes: name, price, rating, category, description    │
│  ├── Actions:                                                    │
│  │   ├── addToCart(quantity)                                     │
│  │   ├── addToWishlist()                                        │
│  │   └── compare(otherProduct)                                  │
│  ├── Selectors:                                                 │
│  │   ├── grid: '.product-grid'                                  │
│  │   ├── item: '.product-card'                                  │
│  │   ├── name: '.product-name'                                  │
│  │   └── price: '.product-price'                                │
│  └── Relationships:                                              │
│      ├── Cart (many-to-many)                                    │
│      └── Category (many-to-one)                                 │
│                                                                   │
│  Entity: Cart                                                    │
│  ├── Attributes: items[], total, shipping, tax                  │
│  ├── Actions:                                                    │
│  │   ├── addItem(product, quantity)                             │
│  │   ├── removeItem(itemId)                                     │
│  │   ├── updateQuantity(itemId, quantity)                       │
│  │   └── checkout(paymentMethod)                                │
│  ├── Selectors:                                                 │
│  │   ├── container: '#cart'                                     │
│  │   ├── item: '.cart-item'                                     │
│  │   └── total: '.cart-total'                                   │
│  └── Relationships:                                              │
│      ├── Product (many-to-many)                                  │
│      └── Order (one-to-one)                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Semantic Understanding
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXAMPLE INTERACTION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Task: "Add the best laptop to my cart"                          │
│                                                                   │
│  Traditional (DOM-level):                                        │
│  ├── Click element at index 45                                  │
│  ├── Find button with text "Add"                                │
│  └── Hope it's the right product                                │
│                                                                   │
│  App-Agent (Semantic-level):                                    │
│  ├── Find entity type "Product" where category == "laptop"      │
│  ├── Sort by attribute "rating" descending                       │
│  ├── Get first result (best laptop)                             │
│  └── Call Product.addToCart(bestLaptop, quantity: 1)           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow Engine Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW ENGINE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Workflow: Checkout                                              │
│  ├── Description: Complete purchase flow                        │
│  ├── Preconditions:                                             │
│  │   ├── Cart is not empty                                      │
│  │   └── User is authenticated                                  │
│  ├── Steps:                                                     │
│  │   ├── Step 1: Review Cart                                    │
│  │   │   ├── Action: Navigate to /cart                          │
│  │   │   └── Postcondition: Cart visible                        │
│  │   ├── Step 2: Enter Shipping Info                            │
│  │   │   ├── Action: Call ShippingAgent.setAddress()           │
│  │   │   └── Postcondition: Address validated                  │
│  │   ├── Step 3: Select Payment Method                          │
│  │   │   ├── Action: Call PaymentAgent.selectMethod()          │
│  │   │   └── Postcondition: Method selected                    │
│  │   ├── Step 4: Confirm Order                                   │
│  │   │   ├── Action: Click confirm button                       │
│  │   │   └── Postcondition: Order created                       │
│  │   └── Step 5: Display Confirmation                           │
│  │       ├── Action: Navigate to /order/success                │
│  │       └── Postcondition: Success page visible                │
│  └── Postconditions:                                            │
│      ├── Order created in database                               │
│      ├── Cart cleared                                            │
│      └── Confirmation email sent                                 │
│                                                                   │
│  Execution Flow:                                                │
│  ├── Check preconditions ✓                                      │
│  ├── Execute Step 1 ✓                                          │
│  ├── Execute Step 2 ✓                                          │
│  ├── Execute Step 3 ✓                                          │
│  ├── Execute Step 4 ✓                                          │
│  ├── Execute Step 5 ✓                                          │
│  └── Verify postconditions ✓                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Learning System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNING SYSTEM                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Pattern Extraction & Storage                                    │
│                                                                   │
│  Execution 1:                                                   │
│  ├── Task: "Add laptop to cart"                                 │
│  ├── Steps: [navigate, search, filter, select, add]            │
│  ├── Result: Success (4.5 seconds)                              │
│  └── Pattern: PAT-001 stored                                    │
│                                                                   │
│  Execution 2:                                                   │
│  ├── Task: "Add phone to cart"                                  │
│  ├── Steps: [navigate, search, filter, select, add]            │
│  ├── Result: Success (4.2 seconds)                              │
│  └── Pattern: PAT-001 updated (confidence: 0.95)               │
│                                                                   │
│  Execution 3:                                                   │
│  ├── Task: "Add tablet to cart"                                 │
│  ├── Pattern Match: PAT-001 (similarity: 0.92)                  │
│  ├── Use Optimized Steps: [navigate, search, filter, select, add]│
│  ├── Result: Success (3.8 seconds) ⚡ FASTER                    │
│  └── Pattern: PAT-001 strengthened (confidence: 0.97)          │
│                                                                   │
│  Pattern Metrics:                                               │
│  ├── Success Rate: 97%                                          │
│  ├── Average Time: 4.17s (improved from 5.2s)                  │
│  ├── Usage Count: 45                                             │
│  └── Last Used: 2 hours ago                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Optimizes
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE GAINS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Without Learning:                                               │
│  ├── Each task: Full LLM reasoning cycle                        │
│  ├── Average time: 5.2s per task                                │
│  └── LLM calls: 12 per task                                     │
│                                                                   │
│  With Learning:                                                  │
│  ├── Pattern matched: Optimized execution                       │
│  ├── Average time: 3.1s per task (40% faster)                  │
│  └── LLM calls: 3 per task (75% reduction)                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRAMEWORK INTEGRATIONS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  React Integration:                                              │
│  ├── AppAgentProvider (context provider)                        │
│  ├── useAppAgent() hook                                          │
│  ├── <AppAgentPanel /> component                                 │
│  └── <AppAgentInput /> component                                 │
│                                                                   │
│  Vue Integration:                                                │
│  ├── AppAgentPlugin (Vue plugin)                                 │
│  ├── useAppAgent() composable                                    │
│  ├── <AppAgentPanel /> component                                 │
│  └── <AppAgentInput /> component                                 │
│                                                                   │
│  Svelte Integration:                                             │
│  ├── appAgentStore (writable store)                              │
│  ├── <AppAgentPanel /> component                                 │
│  └── <AppAgentInput /> component                                 │
│                                                                   │
│  Vanilla JS Integration:                                        │
│  ├── window.AppAgent global class                                │
│  ├── new AppAgent(config)                                        │
│  ├── agent.execute(task)                                         │
│  └── IIFE build for CDN                                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Package Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                    PACKAGE DEPENDENCIES                          │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │ app-agent   │ (Main package)
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │    core    │  │     ui     │  │integrations│
    └─────┬──────┘  └────────────┘  └─────┬──────┘
          │                            │
          │                            │
          ▼                            ▼
    ┌─────┴────────────────────────────┴─────┐
    │                                         │
    │  ┌──────────┐  ┌──────────┐  ┌────────┐│
    │  │   state  │  │ semantic │  │workflow││
    │  │ manager  │  │ registry │  │ engine ││
    │  └──────────┘  └──────────┘  └────────┘│
    │                                         │
    │  ┌──────────┐  ┌──────────┐           │
    │  │   multi  │  │ learning │           │
    │  │  agent   │  │  system  │           │
    │  └──────────┘  └──────────┘           │
    └─────────────────────────────────────────┘

    Dependencies flow downward (arrow means "depends on")
    All packages can be used independently
```

## Event System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT SYSTEM                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Event Types:                                                     │
│                                                                   │
│  1. Status Events (Lifecycle)                                   │
│     ├── idle → Agent ready, waiting for task                    │
│     ├── running → Agent executing task                          │
│     ├── waiting → Agent waiting for async operation             │
│     ├── error → Agent encountered error                         │
│     ├── completed → Agent completed task successfully            │
│     └── disposed → Agent cleaned up                             │
│                                                                   │
│  2. History Events (Persistent Memory)                           │
│     ├── step → Agent completed a step                            │
│     ├── observation → Agent observed environment               │
│     ├── reasoning → Agent produced reasoning                    │
│     ├── action → Agent executed action                           │
│     └── result → Agent got result from action                    │
│                                                                   │
│  3. Activity Events (Transient UI Feedback)                      │
│     ├── thinking → Agent is reasoning                           │
│     ├── acting → Agent is executing action                       │
│     ├── waiting → Agent is waiting                               │
│     └── error → Agent encountered error                          │
│                                                                   │
│  4. Dispose Events (Cleanup)                                     │
│     └── dispose → Agent should clean up resources              │
│                                                                   │
│  Event Flow:                                                     │
│  ├── Agent emits event                                           │
│   → Event listeners notified                                     │
│   → UI updates based on event type                               │
│   → History recorded (for history events)                       │
│   → State updated (for status events)                            │
│   → Transient feedback shown (for activity events)               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Error Detection:                                                │
│  ├── LLM response format errors                                 │
│  ├── Tool execution failures                                    │
│  ├── State inconsistencies                                      │
│  ├── Workflow failures                                          │
│  └── Network errors                                              │
│                                                                   │
│  Error Recovery:                                                 │
│  ├── AutoFixer (normalize LLM responses)                         │
│  │   ├── Double JSON stringing fix                              │
│  │   ├── Action name correction                                 │
│  │   ├── Primitive coercion                                     │
│  │   └── Schema validation                                      │
│  ├── Retry logic (exponential backoff)                          │
│  ├── Fallback actions (wait on critical failure)                 │
│  └── User notification (ask for help when stuck)                │
│                                                                   │
│  Error Reporting:                                               │
│  ├── Detailed error messages                                     │
│  ├── Stack traces for debugging                                  │
│  ├── Error context (state, history, etc.)                        │
│  └── Recovery suggestions                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

**Visual Architecture Complete** ✅

This document provides visual representations of:
- System overview and integration points
- Data flow from user input to result
- Multi-agent coordination patterns
- Semantic entity system
- Workflow engine execution
- Learning system optimization
- Framework integration approaches
- Package dependency structure
- Event system architecture
- Error handling mechanisms

All architecture diagrams support the technical specifications in ARCHITECTURE-app-agent.md
