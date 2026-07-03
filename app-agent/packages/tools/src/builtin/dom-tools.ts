/**
 * Built-in DOM interaction tools
 */

import { toolSchemas } from '@app-agent/entities';
import type { z } from 'zod';
import type { Tool } from '../types';

export interface BuiltinToolDeps {
  getFlatTree: () => {
    interactiveElements: Map<number, { selector: string }>;
  };
  getElementByIndex: (
    index: number,
    tree: ReturnType<BuiltinToolDeps['getFlatTree']>,
  ) => Element | null;
  clickElement: (element: Element) => Promise<{ result: string }>;
  inputText: (element: Element, text: string) => Promise<{ result: string }>;
  selectDropdown: (element: Element, value: string) => Promise<{ result: string }>;
  scroll: (
    direction: 'up' | 'down' | 'left' | 'right',
    amount: number,
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
      execute: async (params: z.infer<typeof toolSchemas.wait>) => {
        await deps.delay(params.duration);
        deps.onWait?.(params.duration);
        return `Waited ${params.duration}ms`;
      },
      metadata: baseMetadata('wait'),
    },
    {
      id: 'click',
      name: 'click',
      description: 'Click an interactive element by its index',
      category: 'interaction',
      inputSchema: toolSchemas.click,
      execute: async (params: z.infer<typeof toolSchemas.click>) => {
        const tree = deps.getFlatTree();
        const elementInfo = tree.interactiveElements.get(params.index);
        if (!elementInfo) {
          throw new Error(`Element not found at index ${params.index}`);
        }
        const element = deps.getElementByIndex(params.index, tree);
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
      execute: async (params: z.infer<typeof toolSchemas.input>) => {
        const tree = deps.getFlatTree();
        const element = deps.getElementByIndex(params.index, tree);
        if (!element) {
          throw new Error(`Element not found at index ${params.index}`);
        }
        const result = await deps.inputText(element, params.text);
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
      execute: async (params: z.infer<typeof toolSchemas.select>) => {
        const tree = deps.getFlatTree();
        const element = deps.getElementByIndex(params.index, tree);
        if (!element) {
          throw new Error(`Element not found at index ${params.index}`);
        }
        const result = await deps.selectDropdown(element, params.value);
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
      execute: async (params: z.infer<typeof toolSchemas.scroll>) => {
        const result = await deps.scroll(params.direction, params.amount);
        return result.result;
      },
      metadata: baseMetadata('scroll'),
    },
  ];
}
