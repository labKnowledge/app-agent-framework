/**
 * Application context model — navigation map and capabilities (ADR-0011)
 */

export type NavigationCategory = 'page' | 'settings' | 'admin' | 'external';

export interface NavigationDestination {
  /** Stable key, e.g. "settings.language" */
  id: string;
  /** Route path, e.g. "/settings/language" */
  path: string;
  /** Human label shown in app map */
  label: string;
  description?: string;
  /** Natural language aliases for intent matching */
  aliases?: string[];
  category: NavigationCategory;
  /** When false, navigate tool must not use this entry (default: true for page, false otherwise) */
  navigable?: boolean;
}

export type AppCapabilityKind = 'setting' | 'mutation' | 'query';

export interface AppCapability {
  id: string;
  name: string;
  description: string;
  aliases?: string[];
  /** setting capabilities must not use navigate/DOM as first action */
  kind: AppCapabilityKind;
  /** customTool name to invoke */
  toolName: string;
}

/** Where a discovered link lives in the page chrome */
export type PageNavRegion =
  'header' | 'sidebar' | 'hamburger' | 'footer' | 'main-nav' | 'drawer' | 'unknown';

/** Menu toggle that may reveal hidden navigation (hamburger, drawer trigger) */
export interface PageNavToggle {
  label: string;
  region: PageNavRegion;
  ariaExpanded?: boolean;
  /** Links under this control are likely hidden until opened */
  controlsHiddenLinks: boolean;
}

/** Link discovered from DOM landmarks (nav, header, footer, sidebar, drawer) */
export interface PageNavigationLink {
  label: string;
  href: string;
  region: PageNavRegion;
  /** false when inside collapsed drawer, display:none menu, etc. */
  visible: boolean;
  current?: boolean;
}

/**
 * Compact navigation map scraped from the live page.
 * Includes links in hidden menus so the agent knows what exists behind toggles.
 */
export interface PageNavigationSnapshot {
  links: PageNavigationLink[];
  toggles: PageNavToggle[];
  scannedRegions: PageNavRegion[];
  /** Pre-rendered prompt text (token-budget aware) */
  summary: string;
}

export interface AppContextSnapshot {
  navigation: NavigationDestination[];
  capabilities: AppCapability[];
  currentPath?: string;
  locale?: string;
  /** Live page nav from DOM landmarks (sidebar, footer, hamburger menus) */
  pageNavigation?: PageNavigationSnapshot;
  extras?: Record<string, unknown>;
}

export type TaskIntentKind = 'setting' | 'navigation' | 'domain' | 'informational' | 'unknown';

export interface TaskClassification {
  intent: TaskIntentKind;
  targetId?: string;
  toolName?: string;
  path?: string;
  confidence: number;
}
