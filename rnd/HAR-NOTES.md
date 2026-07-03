# HAR artifacts — handling notes

## `kids.eligapris.tech-app-agent-struggling.har`

Production network capture used to diagnose app-agent failures on the Kidsync pilot (July 2026).

**Do not commit credentials.** This file may contain plaintext login tokens and passwords in `/token` request bodies. Before sharing or pushing:

1. Redact `postData.text` fields on auth endpoints, or
2. Store the sanitized copy in a private artifact bucket and keep only a redacted reference in git.

See app-agent bug docs:

- [BUG-0001](../app-agent/docs/bugs/BUG-0001-react-strictmode-disposed-agent.md)
- [BUG-0002](../app-agent/docs/bugs/BUG-0002-prompt-action-format-mismatch.md) through [BUG-0006](../app-agent/docs/bugs/BUG-0006-dom-cache-stale-after-spa-nav.md)
