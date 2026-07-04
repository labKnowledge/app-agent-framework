# BUG-0007: Wrong navigation — "change language" opens profile

**Status:** Fixed on main via App Context Model (ADR-0011)  
**Reported from:** Kidsync pilot — generalized framework gap  
**Affects:** `@gakwaya/app-agent-core`, `@gakwaya/app-agent-entities`, `@gakwaya/app-agent-react`

## Summary

User asked to **change language**. The agent navigated to **Profile** or clicked a profile link in the DOM instead of updating locale.

## Root cause

1. No registered **capability** for language changes — task fell through to ReAct/DOM.
2. Prompt listed DOM elements (Profile, Settings) without an **Application Map** or capability catalog.
3. LLM conflated user preferences with profile pages.
4. `navigate` had no allowlist — any guessed path was accepted.

## Fix (framework)

- `NavigationDestination[]` + `AppCapability[]` on `AgentConfig`
- Task classifier routes `setting` intents to `customTools` first
- Validated `navigate` when `strictNavigation` (default when navigation registered)
- Context-first prompts: app map + capabilities before DOM

## Integrator pattern (any React app)

```typescript
capabilities: [{
  id: 'changeLanguage',
  name: 'Change Language',
  kind: 'setting',
  toolName: 'setLanguage',
  aliases: ['change language', 'locale'],
}],
customTools: {
  setLanguage: { /* calls i18n.changeLanguage */ },
},
navigation: routesToNavigation([...]),
strictNavigation: true,
```

## References

- [ADR-0011](../adr/ADR-0011-app-context-model.md)
- [Integration guide](../integration-guide.md)
