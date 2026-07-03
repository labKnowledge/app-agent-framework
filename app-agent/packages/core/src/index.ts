/**
 * App-Agent Core Package
 *
 * Core agent logic with ReAct loop, app state awareness,
 * DOM processing, and event-driven state management.
 */

export { AppAgentCore } from './agent';
export { LLMClient } from './llm/client';
export { DOMProcessor, DOMActions } from './dom';
export {
  buildMessages,
  buildSystemPrompt,
  buildUserPrompt,
  buildToolsSection,
  toolDescriptorsFromNames,
} from './prompt-builder';
export type { ToolPromptDescriptor } from './prompt-builder';
export type * from './ports';

export type * from './types';
export type * from './dom/types';
