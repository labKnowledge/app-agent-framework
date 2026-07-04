/**
 * App context sections for context-first prompts
 */

import type { AppContextSnapshot } from '@gakwaya/app-agent-entities';
import type { AppState } from '@gakwaya/app-agent-entities';

export function buildAppMapSection(snapshot: AppContextSnapshot): string {
  if (snapshot.navigation.length === 0) {
    return '';
  }

  const lines = snapshot.navigation.map((dest) => {
    const aliases = dest.aliases?.length ? ` aliases: ${dest.aliases.join(', ')}` : '';
    const nav = dest.navigable === false ? ' [not navigable]' : '';
    return `- ${dest.id}: ${dest.label} → ${dest.path} (${dest.category})${nav}${aliases}`;
  });

  return `\nApplication Map (use navigate only with registered paths):\n${lines.join('\n')}\n`;
}

export function buildCapabilitiesSection(snapshot: AppContextSnapshot): string {
  if (snapshot.capabilities.length === 0) {
    return '';
  }

  const lines = snapshot.capabilities.map((cap) => {
    const aliases = cap.aliases?.length ? ` aliases: ${cap.aliases.join(', ')}` : '';
    return `- ${cap.id} (${cap.kind}): ${cap.name} — tool "${cap.toolName}". ${cap.description}${aliases}`;
  });

  return `\nApplication Capabilities (prefer over DOM clicks; settings must use capabilities, NOT profile/navigation):\n${lines.join('\n')}\n`;
}

export function buildAppStateSection(appState: AppState, snapshot: AppContextSnapshot): string {
  const path = snapshot.currentPath ?? appState.currentView;
  const locale = snapshot.locale ?? (appState.context.locale as string | undefined);
  const contextKeys = Object.keys(appState.context).filter((k) => k !== 'appContext');

  let section = `\nApplication State:\n- Current path/view: ${path}\n- User: ${appState.user.id} (${appState.user.role})\n- Authenticated: ${appState.user.isAuthenticated}`;

  if (locale) {
    section += `\n- Locale: ${locale}`;
  }

  if (contextKeys.length > 0) {
    const highlights = contextKeys
      .slice(0, 8)
      .map((k) => `- ${k}: ${JSON.stringify(appState.context[k])}`)
      .join('\n');
    section += `\n${highlights}`;
  }

  return `${section}\n`;
}

export function buildContextFirstGuidance(): string {
  return `
Navigation and settings rules:
- "change language" / locale → use changeLanguage capability (setLanguage tool), NOT navigate to /profile
- "go to attendance" / open a page → use navigate with a path from the Application Map
- Do not guess routes or click profile/settings links for preference changes
- Use DOM interaction only when no capability or registered navigation applies
`;
}
