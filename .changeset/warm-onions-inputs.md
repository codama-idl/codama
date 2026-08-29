---
'@codama/dynamic-address-resolution': patch
'@codama/dynamic-instructions': patch
---

Accept the `__discriminator` field the enum codec now emits: the argument validator and codec input transformer strip it before payload validation and encoding.
