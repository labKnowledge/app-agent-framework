# BUG-0002: Misleading action prompt → `Unknown action: action_name`

**Status:** Fixed  
**Reported from:** Kidsync HAR (`kids.eligapris.tech-app-agent-struggling.har`)  
**Affects:** `@gakwaya/app-agent-core`, `@gakwaya/app-agent-llm`  
**Severity:** High — every LLM step fails action execution

## Summary

The system prompt told the model to use `action: { action_name: parameters }`, but runtime expects `{ "click": { "index": 0 } }`. Production LLM (qwen-plus) returned HAR-shaped actions; `act()` resolved the tool name as `action_name`.

## Fix

- Correct action examples in `packages/core/src/prompt-builder.ts`
- Inject registered tool catalog into the user prompt
- Normalize `action_name` / `navigate_to_url` shapes in `packages/llm/src/parse-reasoning.ts`

## References

- `packages/core/src/prompt-builder.ts`
- `packages/llm/src/parse-reasoning.ts`
- `packages/core/src/agent.ts` (`act`)
