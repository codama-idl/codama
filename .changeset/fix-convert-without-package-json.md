---
"@codama/cli": patch
---

Make `codama convert` work without a `package.json`. The CLI no longer throws `Cannot read package.json` when converting an Anchor IDL outside a Node project: it resolves an already-installed `@codama/nodes-from-anchor` adapter directly, and otherwise falls back to the existing install prompt.
