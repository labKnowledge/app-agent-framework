/**
 * Task classifier — setting vs navigation vs domain
 */

import type {
  AppCapability,
  NavigationDestination,
  TaskClassification,
} from '@gakwaya/app-agent-entities';
import { CapabilityRegistry } from './capability-registry';
import { NavigationRegistry } from './navigation-registry';

export function classifyTask(
  task: string,
  navigationRegistry: NavigationRegistry,
  capabilityRegistry: CapabilityRegistry
): TaskClassification {
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

  const navMatch = navigationRegistry.resolve(task, 0.45);
  if (navMatch) {
    return {
      intent: 'navigation',
      targetId: navMatch.id,
      path: navMatch.path,
      confidence: 0.85,
    };
  }

  return { intent: 'unknown', confidence: 0 };
}

export function buildAppContextSnapshot(
  navigation: NavigationDestination[],
  capabilities: AppCapability[],
  appState?: { currentView?: string; context?: Record<string, unknown> }
): import('@gakwaya/app-agent-entities').AppContextSnapshot {
  const ctx = appState?.context ?? {};
  const appContext = ctx.appContext as Record<string, unknown> | undefined;

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
    extras:
      typeof appContext?.extras === 'object'
        ? (appContext.extras as Record<string, unknown>)
        : undefined,
  };
}
