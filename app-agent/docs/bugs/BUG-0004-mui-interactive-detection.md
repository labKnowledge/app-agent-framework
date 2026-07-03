# BUG-0004: MUI/React SPA controls not detected → empty DOM content

**Status:** Fixed  
**Reported from:** Kidsync HAR (dashboard `/dashboard`)  
**Affects:** `@gakwaya/app-agent-core`  
**Severity:** Medium — zero indexed elements on common SPAs

## Summary

`DOMProcessor.isInteractive()` treated any `role` attribute as interactive, but missed explicit ARIA roles like `menuitem` and `tab` while still being too coarse. MUI `role="button"` divs should be indexed; decorative `role="presentation"` should not.

## Fix

Use an allowlist of interactive ARIA roles instead of any `role` attribute.

## References

- `packages/core/src/dom/processor.ts`
