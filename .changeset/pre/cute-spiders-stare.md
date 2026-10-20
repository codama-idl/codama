---
'@codama/dynamic-address-resolution': major
'@codama/dynamic-client': patch
'@codama/dynamic-instructions': patch
'@codama/errors': minor
---

Fix gaps in dynamic account address resolution and type generation. Required accounts whose default value resolves to nothing, e.g. an omitted optional account, now throw `CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING` instead of being left out of the instruction, PDA seeds injected from an `accountValueNode` resolve to the address of that account, and reading account data without `fetchAccounts` throws the new `CODAMA_ERROR__DYNAMIC_CLIENT__FETCH_ACCOUNTS_MISSING` (2500022) error instead of a `TypeError`. Generated types follow the program of defined type links, and reference recursive defined types through `${Type}Args` aliases emitted by the new `generateDefinedTypes` function instead of overflowing the stack.

**BREAKING CHANGES**

**Path-based codegen helpers.** `codamaTypeToTS` and `getResolutionRefs` from `@codama/dynamic-address-resolution/codegen` take the path of their type or instruction, and optional linkables, instead of the defined types of the main program, so that links resolve within the right program.

```diff
- codamaTypeToTS(instruction.data, root.program.definedTypes);
- getResolutionRefs(instruction, root.program.definedTypes);
+ codamaTypeToTS([root, root.program, instruction, instruction.data]);
+ getResolutionRefs([root, root.program, instruction]);
```
