---
'@codama/nodes-from-anchor': patch
---

Fix variable `string` and `bytes` PDA seeds from legacy Anchor IDLs to derive from their raw bytes instead of their Borsh size-prefixed encoding, matching the existing behaviour of constant seeds.
