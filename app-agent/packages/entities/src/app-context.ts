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

export interface AppContextSnapshot {
  navigation: NavigationDestination[];
  capabilities: AppCapability[];
  currentPath?: string;
  locale?: string;
  extras?: Record<string, unknown>;
}

export type TaskIntentKind = 'setting' | 'navigation' | 'domain' | 'unknown';

export interface TaskClassification {
  intent: TaskIntentKind;
  targetId?: string;
  toolName?: string;
  path?: string;
  confidence: number;
}
