---
'@codama/dynamic-address-resolution': major
'@codama/errors': major
'@codama/fragments': major
'@codama/nodes-from-anchor': major
'@codama/visitors-core': major
'@codama/visitors': major
'codama': major
---

Trim public exports that were only meant for internal use, so the public API only exposes what consumers need.

**BREAKING CHANGES**

**`@codama/errors` no longer exports `safeCaptureStackTrace`.** It was unused, even by `CodamaError`, and is also gone from `codama`, which re-exports it. Call `Error.captureStackTrace` directly if you need it.

**`@codama/fragments/javascript` no longer exports `preferIncoming`.** Use `mergeImportMaps` or `addToImportMap`, which apply the same conflict-resolution rule.

**`@codama/dynamic-address-resolution` no longer exports `OPTIONAL_NODE_KINDS`.** Check the type node kind directly, e.g. `isNode(type, ['optionTypeNode', 'remainderOptionTypeNode', 'zeroableOptionTypeNode'])`.

**`@codama/nodes-from-anchor` only exports its root and program converters.** The per-node converters, their options types and the generics helpers are now internal. Convert whole IDLs with `rootNodeFromAnchor` (or `rootNodeFromAnchorV00`, `rootNodeFromAnchorV01`, `programNodeFromAnchorV00` and `programNodeFromAnchorV01`) and pick the nodes you need from the result. The removed exports are:

- `accountNodeFromAnchorV00`, `arrayTypeNodeFromAnchorV00`, `constantNodeFromAnchorV00`, `definedTypeNodeFromAnchorV00`, `enumTypeNodeFromAnchorV00`, `enumVariantTypeNodeFromAnchorV00`, `errorNodeFromAnchorV00`, `eventNodeFromAnchorV00`, `instructionAccountNodeFromAnchorV00`, `instructionAccountNodesFromAnchorV00`, `instructionNodeFromAnchorV00`, `mapTypeNodeFromAnchorV00`, `optionTypeNodeFromAnchorV00`, `pdaNodeFromAnchorV00`, `pdaSeedTypeNodeFromAnchorV00`, `setTypeNodeFromAnchorV00`, `structFieldTypeNodeFromAnchorV00`, `structTypeNodeFromAnchorV00`, `tupleTypeNodeFromAnchorV00`, `typeNodeFromAnchorV00` and `InstructionAccountNodeFromAnchorV00Options`.
- `accountNodeFromAnchorV01`, `arrayTypeNodeFromAnchorV01`, `constantNodeFromAnchorV01`, `definedTypeNodeFromAnchorV01`, `enumTypeNodeFromAnchorV01`, `enumVariantTypeNodeFromAnchorV01`, `errorNodeFromAnchorV01`, `eventNodeFromAnchorV01`, `instructionAccountNodeFromAnchorV01`, `instructionAccountNodesFromAnchorV01`, `instructionNodeFromAnchorV01`, `optionTypeNodeFromAnchorV01`, `pdaSeedNodeFromAnchorV01`, `structFieldTypeNodeFromAnchorV01`, `structTypeNodeFromAnchorV01`, `tupleTypeNodeFromAnchorV01`, `typeNodeFromAnchorV01`, `unwrapGenericTypeFromAnchorV01`, `extractGenerics`, `GenericsV01`, `InstructionAccountNodeFromAnchorV01Options` and `PdaSeedNodeFromAnchorV01Options`.
- `extractPdasFromProgram`: use `extractPdasVisitor` instead.

```diff
- import { accountNodeFromAnchorV01 } from '@codama/nodes-from-anchor';
- const account = accountNodeFromAnchorV01(idl.accounts[0], idl.types, generics);
+ import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
+ const account = rootNodeFromAnchor(idl).program.accounts?.[0];
```

**`@codama/visitors-core` no longer exports `LINKABLE_NODES`, `getDependencies` and `assertNodePathHasProgram`.** These are also gone from `@codama/visitors` and `codama`, which re-export it. Use `findProgramNodeFromPath` to check that a path has a program, and `getResolvedInstructionInputsVisitor` to resolve instruction input dependencies.
