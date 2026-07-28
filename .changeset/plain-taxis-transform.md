---
'@codama/dynamic-address-resolution': patch
'@codama/dynamic-instructions': patch
---

Accept bare empty-variant names and indices as enum codec inputs, resolving them to the `{ __kind }` shape, and match display labels against the discriminated union decoding of scalar enums.
