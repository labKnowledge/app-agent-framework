/**
 * Prompt construction for ReAct loop
 */

import type { AgentObservation } from '@gakwaya/entities';
import type { LLMMessage } from '@gakwaya/entities';

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
- action: { action_name: parameters }

Available actions will be provided in the user message.`;
}

export function buildUserPrompt(
  task: string,
  observation: AgentObservation,
  history: Array<{ type: string; data: unknown }>
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

${observations.length > 0 ? `Observations:\n${observations.map((o) => `- ${o}`).join('\n')}\n` : ''}${historyText}`;
}

export function buildMessages(
  task: string,
  observation: AgentObservation,
  history: Array<{ type: string; data: unknown }>,
  entityContext?: string,
  memoryContext?: string
): LLMMessage[] {
  let userContent = buildUserPrompt(task, observation, history);
  if (memoryContext) {
    userContent += memoryContext;
  }

  return [
    { role: 'system', content: buildSystemPrompt(entityContext) },
    { role: 'user', content: userContent },
  ];
}
