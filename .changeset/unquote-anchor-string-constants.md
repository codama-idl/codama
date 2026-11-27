---
'@codama/nodes-from-anchor': patch
---

Remove the quotes Anchor keeps around string constants, e.g. `pub const SEED: &str = "anchor";` now gives the value `anchor` instead of `"anchor"`.
