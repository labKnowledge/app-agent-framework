/**
 * App-Agent Core Package
 *
 * Core agent logic with ReAct loop, app state awareness,
 * DOM processing, and event-driven state management.
 */

export { AppAgentCore } from './agent';
export { LLMClient } from './llm/client';
export { DOMProcessor, DOMActions, extractPageNavigation, serializePageNavigation } from './dom';
export type { PageNavigationConfig } from './dom/page-navigation';
export {
  buildMessages,
  buildSystemPrompt,
  buildUserPrompt,
  buildToolsSection,
  toolDescriptorsFromNames,
} from './prompt-builder';
export type { ToolPromptDescriptor } from './prompt-builder';
export type * from './ports';
export * from './observation-system';

export type * from './types';
export type * from './dom/types';
