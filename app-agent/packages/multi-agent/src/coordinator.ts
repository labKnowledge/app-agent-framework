import type { AgentResult } from '@gakwaya/app-agent-entities';
import type { AgentContext, AgentDelegate, AgentRoutingResult, SpecializedAgent } from './types';

const KEYWORD_WEIGHT = 1.0;

export class MultiAgentCoordinator {
  private agents = new Map<string, SpecializedAgent>();

  registerAgent(agent: SpecializedAgent): void {
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): SpecializedAgent | undefined {
    return this.agents.get(name);
  }

  listAgents(): SpecializedAgent[] {
    return [...this.agents.values()];
  }

  selectAgent(task: string): AgentRoutingResult | null {
    const normalized = task.toLowerCase();
    let best: AgentRoutingResult | null = null;

    for (const agent of this.agents.values()) {
      const score = this.scoreAgent(normalized, agent.capabilities);
      if (!best || score > best.score) {
        best = { agent, score };
      }
    }

    if (!best || best.score <= 0) {
      return null;
    }

    return best;
  }

  async delegate(agentName: string, task: string, context: AgentContext): Promise<AgentResult> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }
    return agent.execute(task, context);
  }

  private scoreAgent(task: string, capabilities: string[]): number {
    let score = 0;
    for (const capability of capabilities) {
      const keyword = capability.toLowerCase();
      if (task.includes(keyword)) {
        score += KEYWORD_WEIGHT;
      }
    }
    return score;
  }
}

export function createBuiltInAgents(delegate: AgentDelegate): SpecializedAgent[] {
  return [new NavigationAgent(delegate), new CommerceAgent(delegate)];
}

export class NavigationAgent implements SpecializedAgent {
  name = 'navigation';
  description = 'Handles routing, views, and page navigation';
  capabilities = ['navigation', 'routing', 'navigate', 'view', 'page', 'url'];
  canDelegateTo = ['commerce'];

  constructor(private readonly delegate: AgentDelegate) {}

  async execute(task: string, _context: AgentContext): Promise<AgentResult> {
    return this.delegate.execute(`[Navigation specialist] ${task}`);
  }
}

export class CommerceAgent implements SpecializedAgent {
  name = 'commerce';
  description = 'Handles products, cart, checkout, and orders';
  capabilities = ['commerce', 'product', 'cart', 'checkout', 'order', 'shop', 'purchase'];
  canDelegateTo = ['navigation'];

  constructor(private readonly delegate: AgentDelegate) {}

  async execute(task: string, _context: AgentContext): Promise<AgentResult> {
    return this.delegate.execute(`[Commerce specialist] ${task}`);
  }
}
