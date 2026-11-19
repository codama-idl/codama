---
'@codama/visitors-core': patch
---

Carry the resolved signer and optionality of a default account along a chain of defaults in `getResolvedInstructionInputsVisitor`. An account defaulting to an account that itself defaults to a non-signer, e.g. `a` → `b` → `c`, now resolves to an `'either'` signer rather than a required one, and likewise inherits the resolved optionality of its default account.
