/**
 * Prompt construction for ReAct loop
 */

import type { AgentObservation } from '@gakwaya/entities';
import type { LLMMessage } from '@gakwaya/entities';

export interface ToolPromptDescriptor {
  name: string;
  description: string;
  parameters: string;
}

const TOOL_PARAM_HINTS: Record<string, string> = {
  done: '(none — use { "done": true })',
  wait: '{ "duration": number }',
  click: '{ "index": number }',
  input: '{ "index": number, "text": string }',
  select: '{ "index": number, "value": string }',
  scroll: '{ "direction"?: "up"|"down"|"left"|"right", "amount"?: number }',
  navigate: '{ "path": string }',
};

export function buildToolsSection(tools: ToolPromptDescriptor[]): string {
  if (tools.length === 0) {
    return '';
  }

  const lines = tools.map(
    (tool) => `- ${tool.name}: ${tool.description}\n  parameters: ${tool.parameters}`
  );

  return `\nAvailable actions (use exactly one tool name as the sole key in "action"):\n${lines.join('\n')}\n`;
}

export function toolDescriptorsFromNames(
  tools: Array<{ name: string; description: string }>
): ToolPromptDescriptor[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: TOOL_PARAM_HINTS[tool.name] ?? '{}',
  }));
}

export function buildSystemPrompt(entityContext?: string): string {
  const entitySection = entityContext ? `\nRegistered entities:\n${entityContext}\n` : '';

  return `You are an intelligent application agent that can understand and navigate web applications.

You have access to:
- Application state (user data, context, preferences)
- DOM structure (UI elements and interactions)
- Semantic entities (domain concepts like Products, Orders)
- Workflows (multi-step processes)
${entitySection}
Your goal is to help users complete tasks by understanding what they want and executing the right actions.

Think step by step:
1. Evaluate what happened in the previous step
2. Remember important information for future steps
3. Plan the next goal
4. Choose the right action to achieve it

Always respond with a JSON object containing:
- evaluation_previous_goal: What happened in the last step?
- memory: What should you remember?
- next_goal: What do you want to achieve next?
- action: an object with exactly ONE key — the tool name — and tool parameters as the value

Action format examples:
- { "click": { "index": 0 } }
- { "wait": { "duration": 2000 } }
- { "navigate": { "path": "/attendance" } }
- { "done": true }

Do NOT use "action_name", "parameters", "click_element", or "navigate_to_url". Use only the tool names listed in the user message.`;
}

export function buildUserPrompt(
  task: string,
  observation: AgentObservation,
  history: Array<{ type: string; data: unknown }>,
  tools?: ToolPromptDescriptor[]
): string {
  const { appState, domState, observations, stepNumber, totalWaitTime } = observation;

  const historyText =
    history.length > 0
      ? `History:\n${history
          .slice(-3)
          .map((event) => {
            const data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
            return `[${event.type.toUpperCase()}] ${data}`;
          })
          .join('\n')}\n`
      : '';

  const interactiveSection =
    domState.content.trim().length > 0
      ? `Interactive Elements:\n${domState.content}\n${domState.footer ? `${domState.footer}\n` : ''}`
      : `Interactive Elements:\n(no indexed elements found — use "wait" or "scroll" to allow the page to render, or "navigate" with a path; do not invent tool names)\n`;

  const toolsSection = tools ? buildToolsSection(tools) : '';

  return `Task: ${task}

Step: ${stepNumber}
Total Wait Time: ${totalWaitTime}ms

Application State:
- Current View: ${appState.currentView}
- User: ${appState.user.id} (${appState.user.role})
- Authenticated: ${appState.user.isAuthenticated}

DOM State:
- URL: ${domState.url}
- Title: ${domState.title}

${interactiveSection}${toolsSection}${observations.length > 0 ? `Observations:\n${observations.map((o) => `- ${o}`).join('\n')}\n` : ''}${historyText}`;
}

export function buildMessages(
  task: string,
  observation: AgentObservation,
  history: Array<{ type: string; data: unknown }>,
  entityContext?: string,
  memoryContext?: string,
  tools?: ToolPromptDescriptor[]
): LLMMessage[] {
  let userContent = buildUserPrompt(task, observation, history, tools);
  if (memoryContext) {
    userContent += memoryContext;
  }

  return [
    { role: 'system', content: buildSystemPrompt(entityContext) },
    { role: 'user', content: userContent },
  ];
}
