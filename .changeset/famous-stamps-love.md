---
'@codama/visitors': patch
---

Repoint the data paths going through inlined fields in `flattenInstructionDataVisitor`, e.g. a `params.seed` PDA seed becomes `seed`, and leave an instruction's data unflattened, instead of throwing, when inlining would produce conflicting fields or when a data path refers to an inlined field as a whole. Keep the links of enum values in `unwrapDefinedTypesVisitor` and `unwrapTypeDefinedLinksVisitor`, along with the defined types they target, instead of throwing on any enum default value.
