# Integration Guide — Rich App Context

Embed App-Agent in any React SPA with **navigation map**, **capabilities**, and optional quiet execution.

## Principles

1. **Context before DOM** — register routes and capabilities at app shell; DOM is fallback.
2. **Settings are not navigation** — use `AppCapability` with `kind: 'setting'`, not `navigate('/profile')`.
3. **Validated routes** — enable `strictNavigation` when `navigation` is registered.

## Minimal setup

```tsx
import { z } from 'zod';
import {
  AppAgentSessionProvider,
  AppAgentShell,
  routesToNavigation,
  useAppAgentLiveContext,
} from '@gakwaya/app-agent-react';

const navigation = routesToNavigation([
  { path: '/dashboard', label: 'Dashboard', aliases: ['home'] },
  { path: '/attendance', label: 'Attendance', aliases: ['check in'] },
  { path: '/settings/language', label: 'Language', category: 'settings' },
]);

const capabilities = [
  {
    id: 'changeLanguage',
    name: 'Change Language',
    description: 'Update UI locale without opening profile',
    kind: 'setting' as const,
    toolName: 'setLanguage',
    aliases: ['change language', 'locale', 'language settings'],
  },
];

function AppShell() {
  const config = useAppAgentLiveContext({
    navigation,
    capabilities,
    getAppState: async () => ({
      currentView: '/',
      user: { id: 'u1', role: 'admin', isAuthenticated: true },
      context: { locale: i18n.language },
      timestamp: Date.now(),
    }),
    baseConfig: {
      baseURL: import.meta.env.VITE_LLM_BASE_URL,
      model: 'gpt-4',
      strictNavigation: true,
      executionMode: 'quiet',
      onNavigate: (path) => navigate(path),
      customTools: {
        setLanguage: {
          name: 'setLanguage',
          description: 'Change UI language',
          inputSchema: z.object({ language: z.string().optional() }),
          execute: async (params) => {
            await i18n.changeLanguage(params.language ?? 'en');
            return `Language set to ${i18n.language}`;
          },
        },
      },
    },
  });

  return (
    <AppAgentSessionProvider sessionKey="my-app" persistSession config={config}>
      <Routes>...</Routes>
      <AppAgentShell open={open} onOpenChange={setOpen} launcher={...}>
        <MyConsole />
      </AppAgentShell>
    </AppAgentSessionProvider>
  );
}
```

## Kidsync as validation only

Use the [field report](./integration-reports/kidsync-react-plug-and-play-gaps.md) as feedback — implement navigation/capabilities **in the host app**, not in this framework repo.

## Related

- [ADR-0011](./adr/ADR-0011-app-context-model.md)
- [BUG-0007](./bugs/BUG-0007-wrong-navigation-language-profile.md)
