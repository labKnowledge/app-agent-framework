/**
 * React helpers for app navigation context
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { extractPageNavigation } from '@gakwaya/app-agent';
import type { AppAgentConfig } from '@gakwaya/app-agent';
import type {
  AppCapability,
  AppState,
  NavigationCategory,
  NavigationDestination,
  PageNavigationSnapshot,
} from '@gakwaya/app-agent-entities';

export interface RouteNavigationInput {
  path: string;
  label: string;
  description?: string;
  aliases?: string[];
  category?: NavigationCategory;
  navigable?: boolean;
}

export function routesToNavigation(routes: RouteNavigationInput[]): NavigationDestination[] {
  return routes.map((route, index) => ({
    id: route.path.replace(/\//g, '.').replace(/^\./, '') || `route-${index}`,
    path: route.path,
    label: route.label,
    description: route.description,
    aliases: route.aliases,
    category: route.category ?? 'page',
    navigable: route.navigable,
  }));
}

export interface UseAppAgentLiveContextOptions {
  navigation: NavigationDestination[];
  capabilities: AppCapability[];
  getAppState: () => Promise<AppState>;
  baseConfig: Omit<AppAgentConfig, 'getAppState' | 'navigation' | 'capabilities'>;
  /** Merge live DOM nav scan into getAppState (default false — agent scans each step) */
  prefetchPageNavigation?: boolean;
}

/**
 * Scan current page for nav links (header, sidebar, hamburger, footer).
 * Safe to call from getAppState or route-change effects.
 */
export function discoverPageNavigationFromDOM(
  currentPath?: string
): PageNavigationSnapshot | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const snapshot = extractPageNavigation({ currentPath });
  return snapshot.summary ? snapshot : undefined;
}

/**
 * Merge live route path from React Router into agent config.
 */
export function useAppAgentLiveContext(options: UseAppAgentLiveContextOptions): AppAgentConfig {
  const location = useLocation();

  return useMemo(
    () => ({
      ...options.baseConfig,
      navigation: options.navigation,
      capabilities: options.capabilities,
      strictNavigation: options.baseConfig.strictNavigation ?? options.navigation.length > 0,
      getAppState: async () => {
        const state = await options.getAppState();
        const currentPath = location.pathname;
        const pageNavigation = options.prefetchPageNavigation
          ? discoverPageNavigationFromDOM(currentPath)
          : undefined;

        return {
          ...state,
          currentView: currentPath,
          context: {
            ...state.context,
            currentPath,
            ...(pageNavigation ? { pageNavigation } : {}),
            appContext: {
              currentPath,
              locale: state.context.locale,
              ...(pageNavigation ? { pageNavigation } : {}),
            },
          },
        };
      },
    }),
    [location.pathname, options]
  );
}
