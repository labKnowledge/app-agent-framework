/**
 * DOM port for browser isolation
 */

import type { DOMState } from '@app-agent/entities';

export interface DOMPort {
  getChecksum(): string;
  getLocationHref(): string;
  getDocumentTitle(): string;
}

export interface DOMProcessorPort {
  getFlatTree(): {
    interactiveElements: Map<number, { selector: string }>;
  };
  dehydrateTree(tree: ReturnType<DOMProcessorPort['getFlatTree']>): string;
  getElementByIndex(
    index: number,
    tree: ReturnType<DOMProcessorPort['getFlatTree']>
  ): Element | null;
}

export interface DOMActionsPort {
  getScrollPosition(): { atTop: boolean; atBottom: boolean };
  clickElement(element: Element): Promise<{ result: string }>;
  inputText(element: Element, text: string): Promise<{ result: string }>;
  selectDropdown(element: Element, value: string): Promise<{ result: string }>;
  scroll(direction: 'up' | 'down' | 'left' | 'right', amount: number): Promise<{ result: string }>;
}

export interface DOMEnvironment {
  port: DOMPort;
  processor: DOMProcessorPort;
  actions: DOMActionsPort;
}

export function buildDOMState(
  env: DOMEnvironment,
  domTree: ReturnType<DOMProcessorPort['getFlatTree']>
): DOMState {
  const scrollPos = env.actions.getScrollPosition();
  return {
    url: env.port.getLocationHref(),
    title: env.port.getDocumentTitle(),
    content: env.processor.dehydrateTree(domTree),
    header: `Page: ${env.port.getDocumentTitle()} | Scroll: ${scrollPos.atTop ? 'top' : scrollPos.atBottom ? 'bottom' : 'middle'}`,
    footer: `Interactive elements: ${domTree.interactiveElements.size} | ${scrollPos.atBottom ? 'At bottom' : 'Can scroll down'}`,
  };
}
