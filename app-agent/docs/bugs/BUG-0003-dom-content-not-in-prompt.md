# BUG-0003: DOM interactive list omitted from LLM prompt

**Status:** Fixed  
**Reported from:** Kidsync HAR  
**Affects:** `@gakwaya/core`  
**Severity:** High — model cannot choose element indices

## Summary

`observe()` collected `domState.content` (dehydrated interactive elements) but `buildUserPrompt()` only sent URL and title. The model invented element descriptions instead of `{ "click": { "index": N } }`.

## Fix

Include `domState.content`, footer stats, and empty-DOM guidance in the user prompt.

## References

- `packages/core/src/prompt-builder.ts`
