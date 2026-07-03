/**
 * Built-in DOM interaction tools
 */

import { toolSchemas } from '@app-agent/entities';
import type { Tool } from '../types';

export interface BuiltinToolDeps {
  getFlatTree: () => unknown;
  getElementByIndex: (index: number, tree: unknown) => Element | null;
  clickElement: (element: Element) => Promise<{ result: string }>;
  inputText: (element: Element, text: string) => Promise<{ result: string }>;
  selectDropdown: (element: Element, value: string) => Promise<{ result: string }>;
  scroll: (
    direction: 'up' | 'down' | 'left' | 'right',
    amount: number
  ) => Promise<{ result: string }>;
  delay: (ms: number) => Promise<void>;
  onWait?: (duration: number) => void;
}

function baseMetadata(name: string) {
  return {
    tags: ['builtin', name],
    examples: [],
    capabilities: [name],
    riskLevel: 'low' as const,
  };
}

type DomTree = {
  interactiveElements: Map<number, { selector: string }>;
};

export function createBuiltinTools(deps: BuiltinToolDeps): Tool[] {
  return [
    {
      id: 'done',
      name: 'done',
      description: 'Mark the task as complete',
      category: 'utility',
      inputSchema: toolSchemas.done,
      execute: async () => 'Task completed',
      metadata: baseMetadata('done'),
    },
    {
      id: 'wait',
      name: 'wait',
      description: 'Wait for a specified amount of time',
      category: 'utility',
      inputSchema: toolSchemas.wait,
      execute: async (params) => {
        const { duration } = toolSchemas.wait.parse(params);
        await deps.delay(duration);
        deps.onWait?.(duration);
        return `Waited ${duration}ms`;
      },
      metadata: baseMetadata('wait'),
    },
    {
      id: 'click',
      name: 'click',
      description: 'Click an interactive element by its index',
      category: 'interaction',
      inputSchema: toolSchemas.click,
      execute: async (params) => {
        const { index } = toolSchemas.click.parse(params);
        const tree = deps.getFlatTree() as DomTree;
        const elementInfo = tree.interactiveElements.get(index);
        if (!elementInfo) {
          throw new Error(`Element not found at index ${index}`);
        }
        const element = deps.getElementByIndex(index, tree);
        if (!element) {
          throw new Error(`Element not found in DOM: ${elementInfo.selector}`);
        }
        const result = await deps.clickElement(element);
        return result.result;
      },
      metadata: baseMetadata('click'),
    },
    {
      id: 'input',
      name: 'input',
      description: 'Enter text into an input field',
      category: 'interaction',
      inputSchema: toolSchemas.input,
      execute: async (params) => {
        const { index, text } = toolSchemas.input.parse(params);
        const tree = deps.getFlatTree() as DomTree;
        const element = deps.getElementByIndex(index, tree);
        if (!element) {
          throw new Error(`Element not found at index ${index}`);
        }
        const result = await deps.inputText(element, text);
        return result.result;
      },
      metadata: baseMetadata('input'),
    },
    {
      id: 'select',
      name: 'select',
      description: 'Select an option from a dropdown',
      category: 'interaction',
      inputSchema: toolSchemas.select,
      execute: async (params) => {
        const { index, value } = toolSchemas.select.parse(params);
        const tree = deps.getFlatTree() as DomTree;
        const element = deps.getElementByIndex(index, tree);
        if (!element) {
          throw new Error(`Element not found at index ${index}`);
        }
        const result = await deps.selectDropdown(element, value);
        return result.result;
      },
      metadata: baseMetadata('select'),
    },
    {
      id: 'scroll',
      name: 'scroll',
      description: 'Scroll the page in a direction',
      category: 'interaction',
      inputSchema: toolSchemas.scroll,
      execute: async (params) => {
        const { direction, amount } = toolSchemas.scroll.parse(params);
        const result = await deps.scroll(direction, amount);
        return result.result;
      },
      metadata: baseMetadata('scroll'),
    },
  ];
}
