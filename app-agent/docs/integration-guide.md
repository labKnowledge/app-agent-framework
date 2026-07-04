# Integration Guide — Rich App Context

Embed App-Agent in any React SPA with **navigation map**, **capabilities**, and optional quiet execution.

## Principles

1. **Context before DOM** — register routes and capabilities at app shell; DOM is fallback.
2. **Settings are not navigation** — use `AppCapability` with `kind: 'setting'`, not `navigate('/profile')`.
3. **Validated routes** — enable `strictNavigation` when `navigation` is registered.
4. **Assistant-first (default)** — answer questions from app state; navigate only when the user explicitly says go/open/navigate. Use `behaviorMode: 'agent'` for legacy action-first routing.

## Assistant vs agent mode

By default, `behaviorMode` is `'assistant'`:

| User message | Assistant mode (default) | Agent mode (`behaviorMode: 'agent'`) |
|---|---|---|
| "what's in my cart?" | Answer from `getAppState()` or a `query` capability | May navigate to `/cart` |
| "go to cart" | Navigate to `/cart` | Same |
| "change language" | Capability fast-path (`setLanguage`) | Same |

```tsx
baseConfig: {
  behaviorMode: 'assistant', // default — answer first
  // behaviorMode: 'agent',  // legacy fuzzy navigation matching
  enableMultiAgent: false,   // recommended for assistant UIs
}
```

Register `kind: 'query'` capabilities for structured read-only answers:

```tsx
{
  id: 'cartSummary',
  name: 'Cart Summary',
  description: 'Summarize cart from app state',
  kind: 'query' as const,
  toolName: 'getCartSummary',
  aliases: ['cart summary', 'summarize cart'],
}
```

Informational questions (`what`, `how many`, `tell me`, trailing `?`) skip the navigation fast-path and enter the ReAct loop with assistant-first prompts.

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

## Page navigation discovery (DOM landmarks)

Registered `navigation[]` is the source of truth for routing. Many apps also hide links in **hamburger menus, sidebars, and footers** — the agent may miss them if it only sees visible DOM indices.

**Automatic (default):** each agent step runs `extractPageNavigation()` — a lightweight landmark scan (~32 links, ~1.8k chars) that includes **hidden** menu links marked `|hidden` plus toggle hints (`aria-expanded`).

```tsx
// Enabled by default — disable if you only use registered navigation:
baseConfig: {
  discoverPageNavigation: false,
  maxPageNavLinks: 32,
}
```

**Optional prefetch on route change** (React):

```tsx
import { discoverPageNavigationFromDOM } from '@gakwaya/app-agent-react';

const config = useAppAgentLiveContext({
  prefetchPageNavigation: true, // merge into getAppState on each route
  // ...
});
```

Or call directly:

```tsx
import { extractPageNavigation } from '@gakwaya/app-agent';

const snapshot = extractPageNavigation({ currentPath: location.pathname });
// snapshot.summary → compact prompt text
// snapshot.links → { label, href, region, visible }
```

### Prompt order (token budget)

1. Application Map (registered routes)
2. Capabilities
3. **Page Navigation** (discovered links + toggles)
4. Application State
5. DOM Fallback (indexed interactives, capped at 30)

This follows accessibility-tree patterns used by browser-use and page-agent: landmarks first, full interactive tree last. Hidden menus are **not** auto-expanded (avoids side effects); the agent sees what exists and can click the toggle first.

## Kidsync as validation only

Use the [field report](./integration-reports/kidsync-react-plug-and-play-gaps.md) as feedback — implement navigation/capabilities **in the host app**, not in this framework repo.

## Related

- [ADR-0011](./adr/ADR-0011-app-context-model.md)
- [BUG-0007](./bugs/BUG-0007-wrong-navigation-language-profile.md)
