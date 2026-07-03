/**
 * DOM Processing Types
 */

/**
 * Interactive element information
 */
export interface InteractiveElement {
  /** Element index for action targeting */
  index: number;
  /** Tag name */
  tag: string;
  /** Element type (input, button, etc.) */
  type: string;
  /** Element text content */
  text: string;
  /** CSS classes */
  classes: string[];
  /** ARIA label if available */
  ariaLabel?: string;
  /** Placeholder for inputs */
  placeholder?: string;
  /** Whether element is visible */
  visible: boolean;
  /** Whether element is enabled */
  enabled: boolean;
  /** XPath selector */
  xpath: string;
  /** CSS selector */
  selector: string;
  /** Additional attributes */
  attributes: Record<string, string>;
}

/**
 * DOM tree node
 */
export interface DOMTreeNode {
  /** Node index */
  index: number;
  /** Tag name */
  tag: string;
  /** Text content */
  text: string;
  /** Child nodes */
  children: DOMTreeNode[];
  /** Whether interactive */
  interactive: boolean;
  /** Element info if interactive */
  element?: InteractiveElement;
}

/**
 * Flattened DOM tree for LLM consumption
 */
export interface FlatDOMTree {
  /** Tree nodes */
  nodes: DOMTreeNode[];
  /** Interactive elements mapped by index */
  interactiveElements: Map<number, InteractiveElement>;
  /** Total element count */
  totalElements: number;
}

/**
 * DOM processing configuration
 */
export interface DOMProcessorConfig {
  /** Element selectors to whitelist */
  whitelist?: string[];
  /** Element selectors to blacklist */
  blacklist?: string[];
  /** Whether to include hidden elements */
  includeHidden?: boolean;
  /** Maximum elements to process */
  maxElements?: number;
  /** Whether to include attributes */
  includeAttributes?: boolean;
  /** Custom element filter */
  elementFilter?: (element: HTMLElement) => boolean;
}

/**
 * Element interaction result
 */
export interface ElementInteraction {
  /** Whether interaction was successful */
  success: boolean;
  /** Result message */
  result: string;
  /** Element that was interacted with */
  element?: InteractiveElement;
  /** Error if interaction failed */
  error?: Error;
}

/**
 * Scroll position
 */
export interface ScrollPosition {
  /** Scroll X position */
  x: number;
  /** Scroll Y position */
  y: number;
  /** Whether at top */
  atTop: boolean;
  /** Whether at bottom */
  atBottom: boolean;
  /** Whether at left */
  atLeft: boolean;
  /** Whether at right */
  atRight: boolean;
}
