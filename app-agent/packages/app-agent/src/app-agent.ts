/**
 * AppAgent — public facade over AppAgentCore
 */

import { AppAgentCore } from '@gakwaya/core';
import type { AgentResult } from '@gakwaya/entities';
import type { AppAgentConfig } from './types';

export class AppAgent extends AppAgentCore {
  constructor(config: AppAgentConfig) {
    const { entities, workflows, ...coreConfig } = config;

    super({
      ...coreConfig,
      entitySchemas: entities,
      customWorkflows: workflows,
    });
  }

  async execute(task: string): Promise<AgentResult> {
    return super.execute(task);
  }
}
