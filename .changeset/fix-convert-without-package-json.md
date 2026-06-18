---
"@codama/cli": patch
---

Make `codama convert` work without a `package.json`. The CLI resolves an available `@codama/nodes-from-anchor` adapter directly. If the adapter is missing, it suggests an `npx -p` command instead of creating a `package.json`; projects with a `package.json` keep the existing install prompt.
