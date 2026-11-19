---
'@codama/visitors-core': patch
---

Check the transforms, counts, prefixes, sizes and zero values of types that may stop a recursion in `getHasFiniteValueVisitor`. A constant of a type being visited hidden in, e.g., the transforms of a link or an option, or in a sentinel count, can never be created, so `hasDefinedTypeFiniteValue` now reports that type as having no finite value instead of accepting it.
