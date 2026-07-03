# BUG-0006: DOM cache serves stale tree after SPA navigation

**Status:** Fixed  
**Reported from:** Kidsync HAR analysis  
**Affects:** `@gakwaya/app-agent-core`  
**Severity:** Medium — empty or outdated observations after route change

## Summary

DOM cache invalidation relied on a coarse checksum (`button/input/a` count + `innerHTML.length`) and a 5s TTL. Client-side route changes could reuse an empty tree.

## Fix

- Invalidate when `location.href` differs from last observed URL
- Include `interactiveElements.size` in cache checksum
- Clear cache after DOM-mutating actions (`click`, `navigate`, etc.)

## References

- `packages/core/src/agent.ts` (`shouldRebuildDOM`, `observe`, `act`)
