---
'@codama/dynamic-address-resolution': major
'@codama/dynamic-client': major
'@codama/dynamic-instructions': major
'@codama/errors': major
'@codama/validators': major
'@codama/visitors': major
'@codama/visitors-core': major
---

Carry node paths in the remaining error contexts. Contexts that still held nodes or account names now hold node paths instead, e.g. the `cycle` of a circular dependency lists the path of each account and data field it goes through. Production-encoded contexts encode lists of node paths as lists of node selectors. `getInstructionDataFields` now returns the `fieldPath` of each field, and `mapVisitor` gives the visited node to its map function.

**BREAKING CHANGES**

**Nodes and account names replaced by node paths in error contexts.** The following contexts changed, completing the move to node paths.

```diff
  if (isCodamaError(e, CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY)) {
-     const { chain } = e.context; // "a -> b -> a"
+     const { cycle, formattedCycle, path } = e.context; // formattedCycle: "a -> b -> a"
+     const account = cycle[0].at(-1); // instructionAccountNode a
  }
  if (isCodamaError(e, CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE)) {
-     const { accountName } = e.context;
+     const account = e.context.path.at(-1); // e.g. instructionAccountNode
  }
```

| Code | Removed | Added |
| --- | --- | --- |
| `VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES` (1200002) | | `cycle` holds the path of each account and data field instead of the nodes themselves |
| `VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY` (1200004) | `dependency` | use `dependencyKind` and `dependencyName` |
| `VISITORS__INVALID_NUMBER_WRAPPER` (1200006) | | `path` of the number to wrap (empty when the wrapper is invalid on its own) |
| `VISITORS__FAILED_TO_VALIDATE_NODE` (1200008) | | `path` of the validated node |
| `DYNAMIC_CLIENT__INSTRUCTION_NOT_FOUND` (2500000) | | `path` of the program |
| `DYNAMIC_CLIENT__PDA_NOT_FOUND` (2500001) | | `path` of the program |
| `DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE` (2500005) | `accountName` | `path` of the account, remaining accounts, PDA or data field |
| `DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY` (2500008) | `chain` | `path` of the instruction, `cycle`, `formattedCycle` |

**`toAddressOrThrow` takes a node path.** The second argument of `toAddressOrThrow` from `@codama/dynamic-address-resolution` is now the path of the node the value should be the address of, rather than an account name.

```diff
- toAddressOrThrow(value, 'mint');
+ toAddressOrThrow(value, [root, program, instruction, mint]);
```

**Messages changed accordingly.** The messages of these errors now render their `path`, e.g. `Circular dependency detected: [a -> b -> a].` becomes `Circular dependency detected when resolving the accounts and data of instruction [programNode]token.[instructionNode]transfer. Got the following dependency cycle [a -> b -> a].`.
