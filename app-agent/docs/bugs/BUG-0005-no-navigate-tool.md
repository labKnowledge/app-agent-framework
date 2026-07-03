# BUG-0005: No built-in navigation tool

**Status:** Fixed  
**Reported from:** Kidsync HAR  
**Affects:** `@gakwaya/tools`, `@gakwaya/entities`, `@gakwaya/core`  
**Severity:** Medium — model invents `navigate_to_url`

## Summary

When DOM content was empty, the LLM tried `navigate_to_url` repeatedly. Built-in tools only included DOM interactions (`click`, `input`, etc.) with no route navigation.

## Fix

Add `navigate` built-in tool (`{ path: string }`) using `window.location.assign`. Alias `navigate_to_url` → `navigate` in LLM response normalization.

## References

- `packages/tools/src/builtin/dom-tools.ts`
- `packages/entities/src/tool-schemas.ts`
