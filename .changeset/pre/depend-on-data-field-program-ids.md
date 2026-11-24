---
'@codama/visitors-core': patch
---

Depend on a PDA value's `programId` when it is a `dataValueNode` in `getResolvedInstructionInputsVisitor`, so the data field resolves before the PDA value, and keep the instruction account in the path of `CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE` whenever the PDA value is the account's own, including when resolving an injected seed within it rebuilt the value.
