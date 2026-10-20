# @codama/errors

## 2.0.0-rc.0

### Major Changes

- [#1157](https://github.com/codama-idl/codama/pull/1157) [`64d52eb`](https://github.com/codama-idl/codama/commit/64d52eb19d4d853337fd1fbc3a874b1647e7960d) Thanks [@codama-releases](https://github.com/apps/codama-releases)! - Release Codama v2, supporting IDLs of the v2 standard. Upgrade v1 IDLs with the `codama upgrade` command or the `@codama/upgrade` package.

- [#1248](https://github.com/codama-idl/codama/pull/1248) [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Carry node paths in error contexts. Every error about a node now exposes the `path` of that node (a `NodePath` from the root when the thrower knows it, otherwise only the last node(s), e.g. `[node]`) instead of the node itself, its kind or its name. Add `getNodePathString` to render such paths as node selectors.
  
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

- [#1264](https://github.com/codama-idl/codama/pull/1264) [`909960f`](https://github.com/codama-idl/codama/commit/909960ff465c07d0fa63f977fe01bb53c9111806) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Trim public exports that were only meant for internal use, so the public API only exposes what consumers need.
  
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

- [#1261](https://github.com/codama-idl/codama/pull/1261) [`bb09077`](https://github.com/codama-idl/codama/commit/bb09077c6f7e7590836d5c2f02c9fd7dca310b20) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Carry node paths in the remaining error contexts. Contexts that still held nodes or account names now hold node paths instead, e.g. the `cycle` of a circular dependency lists the path of each account and data field it goes through. Production-encoded contexts encode lists of node paths as lists of node selectors. `getInstructionDataFields` now returns the `fieldPath` of each field, and `mapVisitor` gives the visited node to its map function.
  
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
  | `DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE` (2500005) | `accountName` | `path` of the account, remaining accounts, PDA or data field, and the `index` of the remaining account at fault |
  | `DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY` (2500008) | `chain` | `path` of the instruction, `cycle`, `formattedCycle` |
  
  **`toAddressOrThrow` takes a node path.** The second argument of `toAddressOrThrow` from `@codama/dynamic-address-resolution` is now the path of the node the value should be the address of, rather than an account name.
  
  ```diff
  - toAddressOrThrow(value, 'mint');
  + toAddressOrThrow(value, [root, program, instruction, mint]);
  ```
  
  It also takes an optional `index` for values given in a list, e.g. `toAddressOrThrow(value, [root, program, instruction, signers], 1)`, which the error carries in its context (it is not rendered in the message).
  
  **Messages changed accordingly.** The messages of these errors now render their `path`, e.g. `Circular dependency detected: [a -> b -> a].` becomes `Circular dependency detected when resolving the accounts and data of instruction [programNode]token.[instructionNode]transfer. Got the following dependency cycle [a -> b -> a].`.

- [#1260](https://github.com/codama-idl/codama/pull/1260) [`3ad402a`](https://github.com/codama-idl/codama/commit/3ad402a5bf132263c989921f9e049468861319b7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Require Node.js 22.12.0 or later.
  
  **BREAKING CHANGES**
  
  **Node.js 20 is no longer supported.** Every package now declares `"engines": { "node": ">=22.12.0" }`, the first Node.js 22 release that supports `require(esm)` by default. Node.js 20 reached its end of life in April 2026, and some dependencies (e.g. `commander`) already require Node.js 22.12.0.

- [#1248](https://github.com/codama-idl/codama/pull/1248) [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add, rename and remove error codes for Codama v2. Renamed codes keep their number, and removed codes are never reused.
  
  New codes:
  
  - `CODAMA_ERROR__INVALID_BRANDED_STRING` (13): `{ actual, expected }`.
  - `CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED` (14): `{ key, path }`.
  - `CODAMA_ERROR__CANNOT_RESOLVE_PATH` (15): `{ path, pathString, segment }`.
  - `CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING` (16): `{ path }`.
  - `CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE` (17): `{ path }`.
  - `CODAMA_ERROR__INVALID_TICKS_PER_SECOND` (18): `{ path, ticksPerSecond }`.
  - `CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER` (19): `{ placeholder, template }`.
  - `CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE` (1200013): `{ expectedKinds, path }`.
  - `CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS` (1200014): `{ path }`.
  - `CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS` (1200015): `{ allowedKeys, selector, unrecognizedKeys }`.
  - `CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND` (1200016): `{ path, pathString }`.
  - `CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND` (1200017): `{ accountName, path }`.
  - `CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND` (1200018): `{ missingMember, path }`.
  - `CODAMA_ERROR__VISITORS__CANNOT_SET_INSTRUCTION_DISCRIMINATOR` (1200019): `{ path, reason }`.
  - `CODAMA_ERROR__DYNAMIC_CLIENT__PDA_SEED_MISSING` (2500020): `{ path }`.
  - `CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM` (2500021): `{ firstIndex, index, path }`.
  
  **BREAKING CHANGES**
  
  **Renamed error codes.** Codama v2 replaces instruction arguments with instruction data, so the codes referring to arguments are renamed after what they now cover (data, account inputs such as remaining accounts, or any value). Their numbers are unchanged.
  
  | Before | After | Code |
  | --- | --- | --- |
  | `CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND` | `CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND` | 1200009 |
  | `CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING` | `CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING` | 2500011 |
  | `CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ARGUMENT_INPUT` | `CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_INPUT` | 2500013 |
  | `CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE` | `CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` | 2500014 |
  | `CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_ARGUMENT` | `CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA` | 2500015 |
  
  ```diff
  - import { CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING } from '@codama/errors';
  + import { CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING } from '@codama/errors';
  ```
  
  **Removed error codes.** The following codes are not thrown by any Codama v2 package and are removed. Their numbers will not be reused.
  
  - `CODAMA_ERROR__UNEXPECTED_NESTED_NODE_KIND` (3): nested type nodes no longer exist since type wrappers became transforms.
  - `CODAMA_ERROR__ANCHOR__TYPE_PATH_MISSING` (2100003).
  - `CODAMA_ERROR__ANCHOR__PROGRAM_ID_KIND_UNIMPLEMENTED` (2100005).
  - `CODAMA_ERROR__DYNAMIC_CLIENT__DEFAULT_VALUE_MISSING` (2500012).
  
  **Deprecated resolver error codes.** `CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING` (2500007) and `CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER` (2500016) are still exported but deprecated, since Codama v2 removes `resolverValueNode` and they are no longer thrown.

### Minor Changes

- [#1258](https://github.com/codama-idl/codama/pull/1258) [`1f0fb88`](https://github.com/codama-idl/codama/commit/1f0fb881c3334110ea673772dcdb832c1e3885df) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Reject v1 instructions whose upgrade would provide clashing values under the same key, instead of producing conflicting `provides` entries. Providing a contextual argument default under a key already provided with a different value, or under the key of a v1 injection it would then resolve, now throws the new `CODAMA_ERROR__CANNOT_UPGRADE_CONFLICTING_PROVIDED_KEY` error, while identical values are provided once.

- [#1256](https://github.com/codama-idl/codama/pull/1256) [`e92df74`](https://github.com/codama-idl/codama/commit/e92df74ea8495d419c74e5d42c4aa74293eae393) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix gaps in dynamic account address resolution and type generation. Required accounts whose default value resolves to nothing, e.g. an omitted optional account, now throw `CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING` instead of being left out of the instruction, PDA seeds injected from an `accountValueNode` resolve to the address of that account, and reading account data without `fetchAccounts` throws the new `CODAMA_ERROR__DYNAMIC_CLIENT__FETCH_ACCOUNTS_MISSING` (2500022) error instead of a `TypeError`. Generated types follow the program of defined type links, and reference recursive defined types through `${Type}Args` aliases emitted by the new `generateDefinedTypes` function instead of overflowing the stack.
  
  **BREAKING CHANGES**
  
  **Path-based codegen helpers.** `codamaTypeToTS` and `getResolutionRefs` from `@codama/dynamic-address-resolution/codegen` take the path of their type or instruction, and optional linkables, instead of the defined types of the main program, so that links resolve within the right program.
  
  ```diff
  - codamaTypeToTS(instruction.data, root.program.definedTypes);
  - getResolutionRefs(instruction, root.program.definedTypes);
  + codamaTypeToTS([root, root.program, instruction, instruction.data]);
  + getResolutionRefs([root, root.program, instruction]);
  ```

- [#1261](https://github.com/codama-idl/codama/pull/1261) [`bb09077`](https://github.com/codama-idl/codama/commit/bb09077c6f7e7590836d5c2f02c9fd7dca310b20) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Render every node path of an error context as node selectors in error messages, not only `path`, as well as lists of node paths, e.g. a `cycle`. `getNodePathString` falls back to the `name` of nodes that have no `identifier`, so v1 nodes render too.

- [#1221](https://github.com/codama-idl/codama/pull/1221) [`b869cef`](https://github.com/codama-idl/codama/commit/b869cefbe05a2ccd1fed9fb9750ad9de0abe66b8) Thanks [@tsiklic1](https://github.com/tsiklic1)! - Add `addProgramsVisitor` to append programs to a root node's additional programs, rejecting identifiers that collide with existing or other new programs after conversion to camelCase.

### Patch Changes

- Updated dependencies [[`e1cce0d`](https://github.com/codama-idl/codama/commit/e1cce0d1b1841c82f58896381b628c2beb6962d6), [`64d52eb`](https://github.com/codama-idl/codama/commit/64d52eb19d4d853337fd1fbc3a874b1647e7960d), [`3ad402a`](https://github.com/codama-idl/codama/commit/3ad402a5bf132263c989921f9e049468861319b7), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`08d72e7`](https://github.com/codama-idl/codama/commit/08d72e75f10c587091c6e3384acf3d3e2c09d391)]:
  - @codama/node-types@2.0.0-rc.0

## 1.11.0

### Minor Changes

- [#1095](https://github.com/codama-idl/codama/pull/1095) [`b418a9e`](https://github.com/codama-idl/codama/commit/b418a9e19b0b15a3dc1c79edb246d78694d6310e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add the `CODAMA_ERROR__UNSUPPORTED_VERSION` error code for Codama IDLs that predate the 1.0.0 specification. The `CODAMA_ERROR__VERSION_MISMATCH` message now points older versions at the `@codama/upgrade` package and newer versions at updating their Codama dependencies.

### Patch Changes

- [#1094](https://github.com/codama-idl/codama/pull/1094) [`abefbeb`](https://github.com/codama-idl/codama/commit/abefbeb3ae369b01a46794ca3824a23391548040) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix `validateCodamaVersion` to compare the document's version against the Codama spec version (`CODAMA_VERSION`) instead of the npm package version, which is an unrelated namespace and caused false mismatches whenever the two drifted apart. The function now accepts any string and narrows it to `CodamaVersion` on success, rejects unparsable versions, and no longer special-cases 0.x versions. The `CODAMA_ERROR__VERSION_MISMATCH` message is reworded accordingly.
- Updated dependencies [[`fa4a453`](https://github.com/codama-idl/codama/commit/fa4a45315028a9cb125ebaf31695df82a6ffc1c6), [`55b9ede`](https://github.com/codama-idl/codama/commit/55b9edef01767a29d7ebeeeaed3bd75610150e28), [`dabfe42`](https://github.com/codama-idl/codama/commit/dabfe42211380aa16109058142dec6b21ced3835)]:
  - @codama/node-types@1.11.0

## 1.10.2

### Patch Changes

- [#1081](https://github.com/codama-idl/codama/pull/1081) [`21c278c`](https://github.com/codama-idl/codama/commit/21c278c46a0e509095f7b88b0475280022bca794) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Correct error context types that could never match their runtime values, surfaced by type-aware linting: validation items and their node paths are now `readonly`, and the `CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY` context types its `dependency` as the dangling `AccountValueNode | ArgumentValueNode` reference it actually receives. The `CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND` context now carries the resolved enum type node instead of the defined type link, and account-field-not-found errors normalise the missing field name to camel case.
- Updated dependencies []:
  - @codama/node-types@1.10.2

## 1.10.1

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.10.1

## 1.10.0

### Patch Changes

- Updated dependencies [[`add9be2`](https://github.com/codama-idl/codama/commit/add9be28470d66ad2e99fab7688597ef7840cb4a)]:
    - @codama/node-types@1.10.0

## 1.9.0

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.9.0

## 1.8.0

### Patch Changes

- Updated dependencies [[`2f7c443`](https://github.com/codama-idl/codama/commit/2f7c44377520fdb512de7d25b74a03ffd8c1a491), [`8667174`](https://github.com/codama-idl/codama/commit/8667174aabec62aed0a6a11822a87e66c9720246)]:
    - @codama/node-types@1.8.0

## 1.7.0

### Patch Changes

- Updated dependencies [[`d4aa3bf`](https://github.com/codama-idl/codama/commit/d4aa3bfdd1ec7db95710aeed28ce62db84f11655)]:
    - @codama/node-types@1.7.0

## 1.6.0

### Minor Changes

- [#987](https://github.com/codama-idl/codama/pull/987) [`2428220`](https://github.com/codama-idl/codama/commit/2428220162766b7f0547cea8d5f617a93b06732d) Thanks [@mikhd](https://github.com/mikhd)! - Add `dynamic-client` - a runtime Solana instruction builder

### Patch Changes

- [#985](https://github.com/codama-idl/codama/pull/985) [`6487af5`](https://github.com/codama-idl/codama/commit/6487af56598eee691a67c7e7966626ac6d0a2624) Thanks [@daog1](https://github.com/daog1)! - Add new `EventNode` to `ProgramNode` and update the Anchor adapter accordingly.

- Updated dependencies [[`6487af5`](https://github.com/codama-idl/codama/commit/6487af56598eee691a67c7e7966626ac6d0a2624)]:
    - @codama/node-types@1.6.0

## 1.5.1

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.5.1

## 1.5.0

### Patch Changes

- Updated dependencies [[`e537ed3`](https://github.com/codama-idl/codama/commit/e537ed3a08e0fc0c57251ac2109f8499ad8e3803)]:
    - @codama/node-types@1.5.0

## 1.4.4

### Patch Changes

- [#944](https://github.com/codama-idl/codama/pull/944) [`6ad73e4`](https://github.com/codama-idl/codama/commit/6ad73e44a8c866706483a0da3280479324903307) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Enable Rollup treeshaking pass by default, disable only for CLI builds

- Updated dependencies [[`6ad73e4`](https://github.com/codama-idl/codama/commit/6ad73e44a8c866706483a0da3280479324903307)]:
    - @codama/node-types@1.4.4

## 1.4.3

### Patch Changes

- [#942](https://github.com/codama-idl/codama/pull/942) [`ef5d104`](https://github.com/codama-idl/codama/commit/ef5d104af0746d46a41a2733f1cd5600c538aad9) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove treeshake workaround for Rollup's deprecated assert syntax

- Updated dependencies [[`ef5d104`](https://github.com/codama-idl/codama/commit/ef5d104af0746d46a41a2733f1cd5600c538aad9)]:
    - @codama/node-types@1.4.3

## 1.4.2

### Patch Changes

- [#934](https://github.com/codama-idl/codama/pull/934) [`5ec491f`](https://github.com/codama-idl/codama/commit/5ec491f446e37cbb98407dc16b608fd2a649be00) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add Codama error for missing dependency versions

- Updated dependencies []:
    - @codama/node-types@1.4.2

## 1.4.1

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.4.1

## 1.4.0

### Patch Changes

- Updated dependencies [[`5c3fb46`](https://github.com/codama-idl/codama/commit/5c3fb46cf5898ec9130d1f29bd7a876fcef19128)]:
    - @codama/node-types@1.4.0

## 1.3.8

### Patch Changes

- [#913](https://github.com/codama-idl/codama/pull/913) [`07825de`](https://github.com/codama-idl/codama/commit/07825dec4cbd9d773f3197a46964dfb38d63d80e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Unwrap generic types and constants from Anchor IDLs when converting them to Codama IDLs.

- Updated dependencies []:
    - @codama/node-types@1.3.8

## 1.3.7

### Patch Changes

- Updated dependencies [[`55122fd`](https://github.com/codama-idl/codama/commit/55122fda70f5a832fd791cda17172e41cbe55c1b)]:
    - @codama/node-types@1.3.7

## 1.3.6

### Patch Changes

- [#846](https://github.com/codama-idl/codama/pull/846) [`a62b4c5`](https://github.com/codama-idl/codama/commit/a62b4c5701b92642b8e4069953969f1f9c3dd20c) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace chalk with picocolors in CLI

- Updated dependencies []:
    - @codama/node-types@1.3.6

## 1.3.5

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.3.5

## 1.3.4

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.3.4

## 1.3.3

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.3.3

## 1.3.2

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.3.2

## 1.3.1

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.3.1

## 1.3.0

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.3.0

## 1.2.13

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.2.13

## 1.2.12

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.2.12

## 1.2.11

### Patch Changes

- Updated dependencies [[`5071455`](https://github.com/codama-idl/codama/commit/5071455b05359fc427c1d6295e7abb0e39503a15)]:
    - @codama/node-types@1.2.11

## 1.2.10

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.2.10

## 1.2.9

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.2.9

## 1.2.8

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.2.8

## 1.2.7

### Patch Changes

- [#485](https://github.com/codama-idl/codama/pull/485) [`7e275ab`](https://github.com/codama-idl/codama/commit/7e275ab51c6d1b20b54ea9f4976b0692a308b2d2) Thanks [@steveluscher](https://github.com/steveluscher)! - The JS renderer depends on `@solana/web3.js` at version 2. That library has been renamed to `@solana/kit` starting from version 2.1. Codama has been updated to use `@solana/kit@^2.1.0` instead of `@solana/web3.js`

- Updated dependencies []:
    - @codama/node-types@1.2.7

## 1.2.6

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.2.6

## 1.2.5

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.2.5

## 1.2.4

### Patch Changes

- [`f0c2190`](https://github.com/codama-idl/codama/commit/f0c219076af58c098319f4ca9494a98e198d99a1) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix wrong bin CLI path in package.json

- Updated dependencies []:
    - @codama/node-types@1.2.4

## 1.2.3

### Patch Changes

- [#430](https://github.com/codama-idl/codama/pull/430) [`4ceeb5e`](https://github.com/codama-idl/codama/commit/4ceeb5e6c479690fe878d25af6a5d48953adfa6a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Improve ESM and CJS support when importing modules in CLI

- Updated dependencies []:
    - @codama/node-types@1.2.3

## 1.2.2

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.2.2

## 1.2.1

### Patch Changes

- [#390](https://github.com/codama-idl/codama/pull/390) [`92efaa9`](https://github.com/codama-idl/codama/commit/92efaa9261f38de10a1b691c5b25ea0ecf95360b) Thanks [@lithdew](https://github.com/lithdew)! - Support constant program ID's for PDA instruction accounts in Anchor.

- Updated dependencies []:
    - @codama/node-types@1.2.1

## 1.2.0

### Patch Changes

- [#334](https://github.com/codama-idl/codama/pull/334) [`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump dependencies

- Updated dependencies []:
    - @codama/node-types@1.2.0

## 1.1.0

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@1.1.0

## 1.0.0

### Major Changes

- [#236](https://github.com/codama-idl/codama/pull/236) [`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Publish codama v1 packages

### Patch Changes

- Updated dependencies [[`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8)]:
    - @codama/node-types@1.0.0

## 0.22.0

### Minor Changes

- [#183](https://github.com/codama-idl/codama/pull/183) [`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `InstructionLinkNode`, `InstructionAccountLinkNode` and `InstructionArgumentLinkNode`

### Patch Changes

- [#180](https://github.com/codama-idl/codama/pull/180) [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add optional `program` attribute to link nodes and namespace linkable nodes under their associated program.

- Updated dependencies [[`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925), [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540), [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b)]:
    - @codama/node-types@0.22.0

## 0.21.5

### Patch Changes

- [#204](https://github.com/codama-idl/codama/pull/204) [`a6849d3`](https://github.com/codama-idl/codama/commit/a6849d36a828e2b6b703f2a86d2ea0ae6d2fa0d8) Thanks [@aspnxdd](https://github.com/aspnxdd)! - Fix `codama_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE` instructionName string to actually print the instructionName.

- Updated dependencies []:
    - @codama/node-types@0.21.5

## 0.21.4

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@0.21.4

## 0.21.3

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@0.21.3

## 0.21.2

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@0.21.2

## 0.21.1

### Patch Changes

- Updated dependencies []:
    - @codama/node-types@0.21.1

## 0.21.0

### Minor Changes

- [#111](https://github.com/codama-idl/codama/pull/111) [`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `RemainderOptionTypeNode`

    A node that represents an optional item using a child `TypeNode` such that the item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer.

### Patch Changes

- Updated dependencies [[`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f)]:
    - @codama/node-types@0.21.0

## 0.20.6

### Patch Changes

- [#102](https://github.com/codama-idl/codama/pull/102) [`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace \_\_DEV\_\_ with NODE_ENV is not production in codama

- Updated dependencies []:
    - @codama/node-types@0.20.6

## 0.20.5

### Patch Changes

- [#42](https://github.com/codama-idl/codama/pull/42) [`908acba`](https://github.com/codama-idl/codama/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8) Thanks [@kespinola](https://github.com/kespinola)! - set anchor account seed definitions on instructions as defaultValue for the associated instruction account. Removes hoisting PDAs to the program node for the time being.

- Updated dependencies []:
    - @codama/node-types@0.20.5

## 0.20.4

### Patch Changes

- Updated dependencies [[`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
    - @codama/node-types@0.20.4

## 0.20.3

### Patch Changes

- [#40](https://github.com/codama-idl/codama/pull/40) [`4bc5823`](https://github.com/codama-idl/codama/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c) Thanks [@febo](https://github.com/febo)! - Fix typo in error message

- Updated dependencies []:
    - @codama/node-types@0.20.3

## 0.20.2

### Patch Changes

- [`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

- Updated dependencies [[`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e)]:
    - @codama/node-types@0.20.2

## 0.20.1

### Patch Changes

- [#21](https://github.com/codama-idl/codama/pull/21) [`0dec0c8`](https://github.com/codama-idl/codama/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix ESM and CJS exports on renderers

- Updated dependencies []:
    - @codama/node-types@0.20.1
