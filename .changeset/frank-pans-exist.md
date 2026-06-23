---
'@codama/dynamic-parsers': patch
---

Identify and decode nodes that omit a discriminator.

When discriminator-based identification finds no match, `identifyData` (and the `identify*` / `parse*` helpers) now fall back to a Node without discriminator but only when the requested kinds resolve to exactly one candidate Node and that Node has no discriminator. Two or more Nodes without discriminator return `undefined`.