/**
 * Convert legacy AgentTool definitions to enhanced Tool format
 */

import type { AgentTool } from '@gakwaya/app-agent-entities';
import type { Tool, ToolCategory } from '../types';

export function agentToolToTool(agentTool: AgentTool, category: ToolCategory = 'utility'): Tool {
  return {
    id: agentTool.name,
    name: agentTool.name,
    description: agentTool.description,
    category,
    inputSchema: agentTool.inputSchema,
    execute: async (params, context) =>
      agentTool.execute(params, {
        appState: context.appState as unknown as import('@gakwaya/app-agent-entities').AppState,
        domState: context.domState as import('@gakwaya/app-agent-entities').DOMState | undefined,
        agent: context.agent as import('@gakwaya/app-agent-entities').IAgent,
        signal: context.signal,
      }),
    metadata: {
      tags: ['legacy'],
      examples: [],
      capabilities: [agentTool.name],
      riskLevel: 'low',
    },
  };
}
