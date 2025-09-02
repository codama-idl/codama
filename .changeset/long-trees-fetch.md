---
'@codama/visitors-core': patch
---

Fix size computation of the `RemainderOptionTypeNode`. This node should always be of variable size unless the item it wraps is of size 0.
