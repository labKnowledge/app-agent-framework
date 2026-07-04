/**
 * Task classifier — setting vs navigation vs domain vs informational
 */

import type {
  AppCapability,
  NavigationDestination,
  TaskClassification,
} from '@gakwaya/app-agent-entities';
import type { BehaviorMode } from '../types';
import { CapabilityRegistry } from './capability-registry';
import { isExplicitNavigationTask, isInformationalTask } from './intent-detection';
import { NavigationRegistry } from './navigation-registry';

export interface ClassifyTaskOptions {
  behaviorMode?: BehaviorMode;
}

export function classifyTask(
  task: string,
  navigationRegistry: NavigationRegistry,
  capabilityRegistry: CapabilityRegistry,
  options?: ClassifyTaskOptions
): TaskClassification {
  const behaviorMode = options?.behaviorMode ?? 'assistant';

  const capMatch = capabilityRegistry.match(task, 0.45);
  if (capMatch) {
    const kind = capMatch.capability.kind;
    return {
      intent: kind === 'query' ? 'domain' : kind === 'setting' ? 'setting' : 'domain',
      targetId: capMatch.capability.id,
      toolName: capMatch.capability.toolName,
      confidence: capMatch.score,
    };
  }

  const explicitNav = isExplicitNavigationTask(task);
  const informational = isInformationalTask(task);

  if (behaviorMode === 'assistant' && informational && !explicitNav) {
    return { intent: 'informational', confidence: 0.9 };
  }

  const allowNavMatch = behaviorMode === 'agent' || explicitNav;
  if (allowNavMatch) {
    const navMatch = navigationRegistry.resolve(task, 0.45);
    if (navMatch) {
      return {
        intent: 'navigation',
        targetId: navMatch.id,
        path: navMatch.path,
        confidence: 0.85,
      };
    }
  }

  return { intent: 'unknown', confidence: 0 };
}

export function buildAppContextSnapshot(
  navigation: NavigationDestination[],
  capabilities: AppCapability[],
  appState?: { currentView?: string; context?: Record<string, unknown> },
  pageNavigation?: import('@gakwaya/app-agent-entities').PageNavigationSnapshot
): import('@gakwaya/app-agent-entities').AppContextSnapshot {
  const ctx = appState?.context ?? {};
  const appContext = ctx.appContext as Record<string, unknown> | undefined;
  const fromContext = ctx.pageNavigation as
    import('@gakwaya/app-agent-entities').PageNavigationSnapshot | undefined;

  return {
    navigation,
    capabilities,
    currentPath:
      (typeof ctx.currentPath === 'string' ? ctx.currentPath : undefined) ??
      (typeof appContext?.currentPath === 'string' ? appContext.currentPath : undefined) ??
      appState?.currentView,
    locale:
      (typeof ctx.locale === 'string' ? ctx.locale : undefined) ??
      (typeof appContext?.locale === 'string' ? (appContext.locale as string) : undefined),
    pageNavigation: pageNavigation ?? fromContext,
    extras:
      typeof appContext?.extras === 'object'
        ? (appContext.extras as Record<string, unknown>)
        : undefined,
  };
}
