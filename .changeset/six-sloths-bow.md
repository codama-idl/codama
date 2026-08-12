---
'@codama/dynamic-instructions': patch
---

Match enum variants from every decoded shape when displaying instructions. Scalar enums decoded as numeric discriminators (explicit or positional) now render their variant label instead of the bare index — e.g. `Authority Type: Freeze Account` instead of `Authority Type: 1` — and `{ __kind }` values match variants regardless of casing.
