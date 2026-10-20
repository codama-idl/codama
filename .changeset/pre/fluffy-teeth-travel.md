---
'@codama/errors': major
---

Carry node paths in error contexts. Every error about a node now exposes the `path` of that node (a `NodePath` from the root when the thrower knows it, otherwise only the last node(s), e.g. `[node]`) instead of the node itself, its kind or its name. Add `getNodePathString` to render such paths as node selectors.

```ts
import { getNodePathString } from '@codama/errors';

getNodePathString(e.context.path); // "[programNode]token.[accountNode]mint"
getNodePathString([root]); // "[rootNode]"
```

**BREAKING CHANGES**

**Node objects, kinds and names removed from error contexts.** Node-related contexts drop fields such as `node`, `kind`, `nodeKind`, `linkNode`, `enum`, `program`, `account`, `instruction`, `pda`, `seed`, `parent` and their redundant `*Name` / `*Kind` companions in favour of a single `path`. The last node of `path` is usually the node the error is about (each context documents where its path ends), and its ancestors are the nodes before it.

```diff
  if (isCodamaError(e, CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING)) {
-     const { accountName, instructionName } = e.context;
+     const account = e.context.path.at(-1); // instructionAccountNode
+     const instruction = e.context.path.at(-2); // instructionNode
  }
  if (isCodamaError(e, CODAMA_ERROR__UNEXPECTED_NODE_KIND)) {
-     const { expectedKinds, kind, node } = e.context;
+     const { expectedKinds, path } = e.context; // empty path when no node was found
  }
```

Contexts that changed (codes are unchanged unless renamed, see the error codes changeset):

| Code | Removed | Added |
| --- | --- | --- |
| `UNEXPECTED_NODE_KIND` (2) | `kind`, `node` | `path` |
| `LINKED_NODE_NOT_FOUND` (4) | `kind`, `linkNode`, `name` | `path` now ends at the link node |
| `ENUM_VARIANT_NOT_FOUND` (9) | `enum`, `enumName` | `path` |
| `DISCRIMINATOR_FIELD_NOT_FOUND` (10) | | `path`; `field` is now a `PathString` |
| `DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE` (11) | `field` | `path` |
| `VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES` (1200000) | `program`, `programName` | `path` |
| `VISITORS__INVALID_PDA_SEED_VALUES` (1200001) | `instruction`, `instructionName`, `pda` | `path` |
| `VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES` (1200002) | `instruction`, `instructionName` | `path`; `cycle` holds `structFieldTypeNode`s instead of `instructionArgumentNode`s |
| `VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE` (1200003) | `instruction`, `instructionName`, `instructionAccount`, `instructionAccountName`, `seed`, `seedName` | `path` (ends at the seed value) |
| `VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY` (1200004) | `instruction`, `instructionName`, `parent`, `parentKind`, `parentName` | `path`, `dependent` (e.g. `owner` or `config.fee`); `dependencyKind` is `'accountValueNode' \| 'dataValueNode'` |
| `VISITORS__ACCOUNT_FIELD_NOT_FOUND` (1200005) | `account`, `name` | `path` |
| `VISITORS__INVALID_NUMBER_WRAPPER` (1200006) | | `kind`, `reason`; `wrapper` is now the wrapper object |
| `VISITORS__FAILED_TO_VALIDATE_NODE` (1200008) | `validationItems[].node` | `validationItems[].cause` |
| `VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND` (1200009) | `argumentName`, `instruction`, `instructionName` | `path`, `fieldName` |
| `VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES` (1200010) | | `path` |
| `DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND` (2500002) | `instructionName` | `path` |
| `DYNAMIC_CLIENT__ACCOUNT_MISSING` (2500003) | `accountName`, `instructionName` | `path` |
| `DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS` (2500004) | `accountName` | `path` |
| `DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING` (2500007) | `accountName` | `path` |
| `DYNAMIC_CLIENT__UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY` (2500009) | `accountName`, `instructionName` | `path` |
| `DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA` (2500010) | `accountName` | `path` (ends at the seed, or at the PDA for its program ID) |
| `DYNAMIC_CLIENT__DATA_MISSING` (2500011) | `argumentName`, `instructionName` | `path`, `pathString` (e.g. `config.fee`) |
| `DYNAMIC_CLIENT__INVALID_ACCOUNT_INPUT` (2500013) | `argumentName` | `path` |
| `DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` (2500014) | `nodeKind` | `path` (the node that rejected the value) |
| `DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA` (2500015) | `argumentName`, `instructionName` | `path` |
| `DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER` (2500016) | `targetKind`, `targetName` | `path` |
| `DYNAMIC_CLIENT__UNSUPPORTED_NODE` (2500018) | `nodeKind` | `path` |
| `RENDERERS__UNSUPPORTED_NODE` (2800000) | `kind`, `node` | `path` |

**`path` always means a node path.** In every context, `path` is a `NodePath`. Path expressions (e.g. `config.fees[0]`) live under `pathString` instead (`CANNOT_RESOLVE_PATH`, `DYNAMIC_CLIENT__DATA_MISSING`, `VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND`), or `field` for discriminators. Identifier fields that remain (e.g. `variant`, `missingField`, `pdaName`) are typed `IdentifierString` instead of `CamelCaseString`.

**Messages render node paths.** Error messages render `$path` with `getNodePathString` (root omitted, an empty path renders as `none`) and many message texts changed accordingly, e.g. `Missing account [mint] in [transfer] instruction.` becomes `Missing account [programNode]token.[instructionNode]transfer.[instructionAccountNode]mint.`. Production-encoded contexts encode `path` as that same string, since nodes cannot be encoded, so decoded production contexts hold a string rather than nodes. Update any code matching on message texts.
