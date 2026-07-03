/**
 * Parse and normalize LLM ReAct reasoning responses
 */

import type { AgentAction, AgentReasoning } from '@gakwaya/app-agent-entities';

const TOOL_ALIASES: Record<string, string> = {
  click_element: 'click',
  navigate_to_url: 'navigate',
  go_to_url: 'navigate',
  navigate_to: 'navigate',
};

const TOOL_PARAM_KEYS: Record<string, string> = {
  navigate: 'path',
};

export function stripMarkdownFences(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (fenced) {
    return fenced[1].trim();
  }
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .trim();
  }
  return trimmed;
}

export function normalizeActionShape(action: unknown): Record<string, unknown> {
  if (!action || typeof action !== 'object' || Array.isArray(action)) {
    throw new Error('Invalid action: must be a non-empty object');
  }

  const record = action as Record<string, unknown>;

  if (record.done === true || record.done === 'true') {
    return { done: true };
  }

  const keys = Object.keys(record);
  if (keys.length === 0) {
    throw new Error('Invalid action: must be a non-empty object');
  }

  if (keys.length === 1 && !['action_name', 'name', 'tool'].includes(keys[0])) {
    return record;
  }

  if (typeof record.action_name === 'string') {
    return wrapToolAction(record.action_name, record.parameters ?? record.params);
  }

  if (typeof record.name === 'string') {
    const { name, parameters, params, ...rest } = record;
    const toolParams = parameters ?? params ?? (Object.keys(rest).length > 0 ? rest : {});
    return wrapToolAction(name as string, toolParams);
  }

  if (typeof record.tool === 'string') {
    const { tool, parameters, params, ...rest } = record;
    const toolParams = parameters ?? params ?? (Object.keys(rest).length > 0 ? rest : {});
    return wrapToolAction(tool as string, toolParams);
  }

  return record;
}

function wrapToolAction(rawName: string, params: unknown): Record<string, unknown> {
  const toolName = TOOL_ALIASES[rawName] ?? rawName;
  const normalizedParams = normalizeToolParams(toolName, params);
  return { [toolName]: normalizedParams };
}

function normalizeToolParams(toolName: string, params: unknown): Record<string, unknown> {
  const record =
    params && typeof params === 'object' && !Array.isArray(params)
      ? { ...(params as Record<string, unknown>) }
      : {};

  if (toolName === 'navigate') {
    if (typeof record.url === 'string' && record.path === undefined) {
      record.path = record.url;
      delete record.url;
    }
  }

  const paramKey = TOOL_PARAM_KEYS[toolName];
  if (paramKey && typeof record[paramKey] !== 'string') {
    const altKey = paramKey === 'path' ? 'url' : undefined;
    if (altKey && typeof record[altKey] === 'string') {
      record[paramKey] = record[altKey];
      delete record[altKey];
    }
  }

  return record;
}

export function parseReasoningContent(content: string): AgentReasoning {
  const stripped = stripMarkdownFences(content);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid reasoning structure');
  }

  if (
    typeof parsed.evaluation_previous_goal !== 'string' ||
    typeof parsed.memory !== 'string' ||
    typeof parsed.next_goal !== 'string'
  ) {
    throw new Error('Invalid reasoning structure');
  }

  const action = normalizeActionShape(parsed.action);

  return {
    evaluationPreviousGoal: parsed.evaluation_previous_goal,
    memory: parsed.memory,
    nextGoal: parsed.next_goal,
    action: action as AgentAction,
  };
}
