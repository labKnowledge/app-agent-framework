/**
 * React helpers for app navigation context
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { AppAgentConfig } from '@gakwaya/app-agent';
import type {
  AppCapability,
  AppState,
  NavigationCategory,
  NavigationDestination,
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
        return {
          ...state,
          currentView: location.pathname,
          context: {
            ...state.context,
            currentPath: location.pathname,
            appContext: {
              currentPath: location.pathname,
              locale: state.context.locale,
            },
          },
        };
      },
    }),
    [location.pathname, options]
  );
}
