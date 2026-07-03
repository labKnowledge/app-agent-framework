/**
 * Default browser DOM port implementation
 */

import type { DOMPort } from './dom-port';
import { DOMProcessor, DOMActions } from '../dom';

export class BrowserDOMPort implements DOMPort {
  getChecksum(): string {
    const elements = document.querySelectorAll('button, input, a, select, textarea');
    return `${elements.length}-${document.documentElement.innerHTML.length}`;
  }

  getLocationHref(): string {
    return window.location.href;
  }

  getDocumentTitle(): string {
    return document.title;
  }
}

export function createBrowserDOMEnvironment(): {
  port: BrowserDOMPort;
  processor: DOMProcessor;
  actions: DOMActions;
} {
  return {
    port: new BrowserDOMPort(),
    processor: new DOMProcessor(),
    actions: new DOMActions(),
  };
}
