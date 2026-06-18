---
'@codama/dynamic-address-resolution': patch
---

Refactor internals of pda-seed-value visitor.
Extract the constant-seed part of `createPdaSeedValueVisitor` into a standalone visitor. The pda-seed-value visitor now extends the constant-pda-seed with variable-seed handling (visitAccountValue / visitArgumentValue) on top. `resolveStandalonePda` method was simplified.