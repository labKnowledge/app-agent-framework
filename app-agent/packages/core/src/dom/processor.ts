/**
 * DOM Processor
 *
 * Extracts and simplifies DOM structure for AI understanding
 * Adapted from page-agent with app-agent enhancements
 */

import type { FlatDOMTree, DOMTreeNode, InteractiveElement, DOMProcessorConfig } from './types';

/**
 * DOM Processor Class
 */
export class DOMProcessor {
  private config: Required<DOMProcessorConfig>;
  private elementCounter = 0;

  constructor(config: DOMProcessorConfig = {}) {
    this.config = {
      whitelist: config.whitelist ?? [],
      blacklist: config.blacklist ?? [],
      includeHidden: config.includeHidden ?? false,
      maxElements: config.maxElements ?? 10000,
      includeAttributes: config.includeAttributes ?? true,
      elementFilter: config.elementFilter ?? (() => true),
    };
  }

  /**
   * Get flattened DOM tree
   */
  getFlatTree(): FlatDOMTree {
    this.elementCounter = 0;
    const nodes: DOMTreeNode[] = [];
    const interactiveElements = new Map<number, InteractiveElement>();

    const root = document.documentElement;
    this.processNode(root, nodes, interactiveElements);

    return {
      nodes,
      interactiveElements,
      totalElements: this.elementCounter,
    };
  }

  /**
   * Process a DOM node
   */
  private processNode(
    node: Node,
    nodes: DOMTreeNode[],
    interactiveElements: Map<number, InteractiveElement>
  ): void {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    // Check element count limit
    if (this.elementCounter >= this.config.maxElements) {
      return;
    }

    // Check blacklist
    if (this.matchesBlacklist(node)) {
      return;
    }

    // Check visibility
    if (!this.config.includeHidden && !this.isVisible(node)) {
      return;
    }

    // Apply custom filter
    if (!this.config.elementFilter(node)) {
      return;
    }

    const index = this.elementCounter++;
    const isInteractive = this.isInteractive(node);

    let elementInfo: InteractiveElement | undefined;
    if (isInteractive) {
      elementInfo = this.extractElementInfo(node, index);
      interactiveElements.set(index, elementInfo);
    }

    const treeNode: DOMTreeNode = {
      index,
      tag: node.tagName.toLowerCase(),
      text: this.getNodeText(node),
      children: [],
      interactive: isInteractive,
      element: elementInfo,
    };

    nodes.push(treeNode);

    // Process children
    for (const child of Array.from(node.children)) {
      this.processNode(child, treeNode.children, interactiveElements);
    }
  }

  /**
   * Extract element information
   */
  private extractElementInfo(element: HTMLElement, index: number): InteractiveElement {
    const tag = element.tagName.toLowerCase();
    const type = (element as HTMLInputElement).type || this.getElementType(element);

    return {
      index,
      tag,
      type,
      text: this.getElementText(element),
      classes: Array.from(element.classList),
      ariaLabel: element.getAttribute('aria-label') || undefined,
      placeholder: (element as HTMLInputElement).placeholder || undefined,
      visible: this.isVisible(element),
      enabled: !('disabled' in element && (element as HTMLInputElement).disabled),
      xpath: this.getXPath(element),
      selector: this.getSelector(element),
      attributes: this.extractAttributes(element),
    };
  }

  /**
   * Check if element matches blacklist
   */
  private matchesBlacklist(element: HTMLElement): boolean {
    for (const selector of this.config.blacklist) {
      if (element.matches(selector)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if element is visible
   */
  private isVisible(element: HTMLElement): boolean {
    if (!element.isConnected) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    return true;
  }

  /**
   * Check if element is interactive
   */
  private isInteractive(element: HTMLElement): boolean {
    const tag = element.tagName.toLowerCase();
    const interactiveTags = new Set([
      'a',
      'button',
      'input',
      'textarea',
      'select',
      'option',
      'label',
      'form',
      'details',
      'summary',
    ]);

    if (interactiveTags.has(tag)) {
      return true;
    }

    // Check for attributes that make elements interactive
    if (
      element.hasAttribute('onclick') ||
      element.hasAttribute('onchange') ||
      element.hasAttribute('onsubmit') ||
      element.hasAttribute('role') ||
      element.getAttribute('tabindex') !== null
    ) {
      return true;
    }

    // Check for contenteditable
    if (element.isContentEditable) {
      return true;
    }

    return false;
  }

  /**
   * Get element type
   */
  private getElementType(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();
    const role = element.getAttribute('role');

    if (role) {
      return role;
    }

    // Infer type from attributes
    if (element.hasAttribute('href')) {
      return 'link';
    }

    return tag;
  }

  /**
   * Get node text content
   */
  private getNodeText(node: Node): string {
    if (node instanceof HTMLElement) {
      // Skip certain elements
      const tag = node.tagName.toLowerCase();
      if (['script', 'style', 'noscript'].includes(tag)) {
        return '';
      }

      // For inputs, get value or placeholder
      if (tag === 'input' || tag === 'textarea') {
        const input = node as HTMLInputElement | HTMLTextAreaElement;
        return input.value || input.placeholder || '';
      }

      // For selects, get selected option
      if (tag === 'select') {
        const select = node as HTMLSelectElement;
        const selectedOption = select.options[select.selectedIndex];
        return selectedOption?.text || '';
      }

      // Get text content, truncating if too long
      const text = node.textContent || '';
      return text.length > 100 ? text.substring(0, 100) + '...' : text;
    }

    return node.textContent || '';
  }

  /**
   * Get element text (for display)
   */
  private getElementText(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();

    // For inputs, use label or placeholder
    if (tag === 'input' || tag === 'textarea') {
      const input = element as HTMLInputElement | HTMLTextAreaElement;
      const label = this.findLabel(element);
      if (label) {
        return label;
      }
      return input.placeholder || input.value || '';
    }

    // For buttons, get text
    if (tag === 'button') {
      return element.textContent?.trim() || element.getAttribute('value') || 'Button';
    }

    // For links, get text or href
    if (tag === 'a') {
      const text = element.textContent?.trim() || '';
      const href = element.getAttribute('href');
      if (href && href.startsWith('/')) {
        return text || href;
      }
      return text || 'Link';
    }

    return this.getNodeText(element).trim();
  }

  /**
   * Find label for element
   */
  private findLabel(element: HTMLElement): string | null {
    // Check for explicit label association
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) {
        return label.textContent?.trim() || null;
      }
    }

    // Check if parent is a label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return (
        parentLabel.textContent
          ?.trim()
          ?.replace(element.textContent || '', '')
          .trim() || null
      );
    }

    return null;
  }

  /**
   * Get XPath for element
   */
  private getXPath(element: HTMLElement): string {
    const parts: string[] = [];
    let current: Element | null = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 1;
      let sibling = current.previousElementSibling;

      while (sibling) {
        if (sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }

      const tagName = current.tagName.toLowerCase();
      const part = index > 1 ? `${tagName}[${index}]` : tagName;
      parts.unshift(part);

      current = current.parentElement;
    }

    return '/' + parts.join('/');
  }

  /**
   * Get CSS selector for element
   */
  private getSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className
        .split(' ')
        .filter((c) => c)
        .map((c) => `.${c}`);
      if (classes.length > 0) {
        return element.tagName.toLowerCase() + classes.join('');
      }
    }

    // Fallback to nth-child
    let index = 1;
    let sibling = element.previousElementSibling;
    while (sibling) {
      index++;
      sibling = sibling.previousElementSibling;
    }

    return `${element.tagName.toLowerCase()}:nth-child(${index})`;
  }

  /**
   * Extract attributes
   */
  private extractAttributes(element: HTMLElement): Record<string, string> {
    if (!this.config.includeAttributes) {
      return {};
    }

    const attributes: Record<string, string> = {};
    const importantAttrs = [
      'id',
      'name',
      'href',
      'src',
      'alt',
      'title',
      'role',
      'aria-label',
      'type',
    ];

    for (const attr of importantAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        attributes[attr] = value;
      }
    }

    return attributes;
  }

  /**
   * Get element by index
   */
  getElementByIndex(index: number, tree: FlatDOMTree): HTMLElement | null {
    const elementInfo = tree.interactiveElements.get(index);
    if (!elementInfo) {
      return null;
    }

    return document.querySelector(elementInfo.selector) || null;
  }

  /**
   * Dehydrate tree to text format
   */
  dehydrateTree(tree: FlatDOMTree): string {
    const lines: string[] = [];

    for (const node of tree.nodes) {
      if (node.interactive && node.element) {
        const el = node.element;
        const marker = el.enabled ? '*' : '!';
        lines.push(
          `[${el.index}]${marker}<${el.type} />${el.text ? '\n    ' + el.text : ''}${
            el.placeholder ? '\n    placeholder: ' + el.placeholder : ''
          }`
        );
      }
    }

    return lines.join('\n');
  }
}
