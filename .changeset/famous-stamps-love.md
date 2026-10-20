---
'@codama/visitors': patch
---

Repoint the data paths going through inlined fields in `flattenInstructionDataVisitor`, e.g. a `params.seed` PDA seed becomes `seed`. It no longer throws on conflicts: a struct field is kept nested, while the others are still inlined, when inlining it would produce conflicting fields or when a data path refers to it as a whole, e.g. a `params` PDA seed.
