/**
 * Prompt construction for ReAct loop
 */

import type { AgentObservation, AppContextSnapshot } from '@gakwaya/app-agent-entities';
import type { LLMMessage } from '@gakwaya/app-agent-entities';
import type { BehaviorMode } from './types';
import {
  buildAppMapSection,
  buildAppStateSection,
  buildAssistantGuidance,
  buildCapabilitiesSection,
  buildContextFirstGuidance,
  buildPageNavigationSection,
} from './app-context/prompt-sections';

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

export function buildSystemPrompt(
  entityContext?: string,
  preferApplicationTools?: boolean,
  hasAppContext?: boolean,
  behaviorMode: BehaviorMode = 'assistant'
): string {
  const entitySection = entityContext ? `\nRegistered entities:\n${entityContext}\n` : '';
  const appToolsHint = preferApplicationTools
    ? `\nPrefer application-specific tools (customTools) and registered capabilities over DOM clicks.\n`
    : '';
  const contextHint = hasAppContext ? buildContextFirstGuidance() : '';
  const assistantHint = behaviorMode === 'assistant' ? buildAssistantGuidance() : '';

  const identity =
    behaviorMode === 'assistant'
      ? 'You are an intelligent application assistant that helps users understand and interact with web applications.'
      : 'You are an intelligent application agent that can understand and navigate web applications.';

  const goal =
    behaviorMode === 'assistant'
      ? 'Your goal is to help users by answering questions from application state and executing UI actions only when explicitly requested.'
      : 'Your goal is to help users complete tasks by understanding what they want and executing the right actions.';

  return `${identity}

You have access to:
- Application map and capabilities (primary — use before DOM)
- Application state (user data, context, preferences)
- DOM structure (fallback for interactions)
- Semantic entities (domain concepts like Products, Orders)
- Workflows (multi-step processes)
${entitySection}${appToolsHint}${contextHint}${assistantHint}
${goal}

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
  tools?: ToolPromptDescriptor[],
  maxDomElements = 30,
  appContext?: AppContextSnapshot
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

  const snapshot: AppContextSnapshot = appContext ?? {
    navigation: [],
    capabilities: [],
    currentPath: appState.currentView,
    locale: appState.context.locale as string | undefined,
  };

  const appMapSection = buildAppMapSection(snapshot);
  const capabilitiesSection = buildCapabilitiesSection(snapshot);
  const pageNavSection = buildPageNavigationSection(snapshot);
  const appStateSection = buildAppStateSection(appState, snapshot);

  const domContent = truncateDomContent(domState.content, maxDomElements);

  const interactiveSection =
    domContent.trim().length > 0
      ? `\nDOM Fallback (use only when no capability/navigation applies):\nInteractive Elements:\n${domContent}\n${domState.footer ? `${domState.footer}\n` : ''}`
      : `\nDOM Fallback:\n(no indexed elements found — use registered navigation/capabilities, "wait", or "scroll")\n`;

  const toolsSection = tools ? buildToolsSection(tools) : '';

  return `Task: ${task}

Step: ${stepNumber}
Total Wait Time: ${totalWaitTime}ms
${appMapSection}${capabilitiesSection}${pageNavSection}${appStateSection}${toolsSection}${interactiveSection}${observations.length > 0 ? `Observations:\n${observations.map((o) => `- ${o}`).join('\n')}\n` : ''}${historyText}`;
}

export function buildMessages(
  task: string,
  observation: AgentObservation,
  history: Array<{ type: string; data: unknown }>,
  entityContext?: string,
  memoryContext?: string,
  tools?: ToolPromptDescriptor[],
  options?: {
    maxDomElements?: number;
    preferApplicationTools?: boolean;
    appContext?: AppContextSnapshot;
    behaviorMode?: BehaviorMode;
  }
): LLMMessage[] {
  const maxDomElements = options?.maxDomElements ?? 30;
  const hasAppContext =
    (options?.appContext?.navigation.length ?? 0) > 0 ||
    (options?.appContext?.capabilities.length ?? 0) > 0;

  let userContent = buildUserPrompt(
    task,
    observation,
    history,
    tools,
    maxDomElements,
    options?.appContext
  );
  if (memoryContext) {
    userContent += memoryContext;
  }

  return [
    {
      role: 'system',
      content: buildSystemPrompt(
        entityContext,
        options?.preferApplicationTools,
        hasAppContext,
        options?.behaviorMode ?? 'assistant'
      ),
    },
    { role: 'user', content: userContent },
  ];
}

function truncateDomContent(content: string, maxElements: number): string {
  if (!content.trim()) {
    return content;
  }

  const lines = content.split('\n');
  const indexed = lines.filter((line) => /^\[\d+\]/.test(line.trim()));
  const other = lines.filter((line) => !/^\[\d+\]/.test(line.trim()));

  if (indexed.length <= maxElements) {
    return content;
  }

  const kept = indexed.slice(0, maxElements);
  const omitted = indexed.length - maxElements;
  return [...kept, `... (${omitted} more elements omitted)`, ...other].join('\n');
}

export { buildAppMapSection, buildCapabilitiesSection } from './app-context/prompt-sections';
