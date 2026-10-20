# @codama/visitors

## 2.0.0-rc.0

### Major Changes

- [#1262](https://github.com/codama-idl/codama/pull/1262) [`e1cce0d`](https://github.com/codama-idl/codama/commit/e1cce0d1b1841c82f58896381b628c2beb6962d6) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove the deprecated node kind aliases, the `ProgramVersion` type and the duplicate node path formatters. Each has a canonical replacement that was already exported.
  
  **BREAKING CHANGES**
  
  **Node kind aliases removed.** The legacy `*_NODES` aliases of `@codama/nodes` are removed in favour of the `*_NODE_KINDS` constants generated from the spec.
  
  ```diff
  - import { CONTEXTUAL_VALUE_NODES, COUNT_NODES, DISCRIMINATOR_NODES, INSTRUCTION_INPUT_VALUE_NODES } from '@codama/nodes';
  - import { LINK_NODES, PDA_SEED_NODES, TYPE_NODES, VALUE_NODES } from '@codama/nodes';
  + import { CONTEXTUAL_VALUE_NODE_KINDS, COUNT_NODE_KINDS, DISCRIMINATOR_NODE_KINDS, INSTRUCTION_INPUT_VALUE_NODE_KINDS } from '@codama/nodes';
  + import { LINK_NODE_KINDS, PDA_SEED_NODE_KINDS, TYPE_NODE_KINDS, VALUE_NODE_KINDS } from '@codama/nodes';
  ```
  
  **`ProgramVersion` removed.** Use the `Version` type instead.
  
  ```diff
  - import type { ProgramVersion } from '@codama/node-types';
  + import type { Version } from '@codama/node-types';
  ```
  
  **Node path formatters removed.** `nodePathToString` and `nodePathToStringArray` are removed from `@codama/visitors-core`. Use `getNodePathString` from `@codama/errors`, which renders paths the way error messages do, or `NodeStack#toString` for the current path of a stack.
  
  ```diff
  - import { nodePathToString, nodePathToStringArray } from '@codama/visitors-core';
  + import { getNodePathString } from '@codama/errors';
  
  - nodePathToString(path);
  + getNodePathString(path);
  - nodePathToStringArray(path);
  + path.map(node => getNodePathString([node]));
  ```

- [#1157](https://github.com/codama-idl/codama/pull/1157) [`64d52eb`](https://github.com/codama-idl/codama/commit/64d52eb19d4d853337fd1fbc3a874b1647e7960d) Thanks [@codama-releases](https://github.com/apps/codama-releases)! - Release Codama v2, supporting IDLs of the v2 standard. Upgrade v1 IDLs with the `codama upgrade` command or the `@codama/upgrade` package.

- [#1248](https://github.com/codama-idl/codama/pull/1248) [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Rework the `update*Visitor` functions for Codama v2: they match and rename nodes by exact `identifier`, reject unknown or missing targets, and repoint every reference to the nodes and members they rename.
  
  **BREAKING CHANGES**
  
  **`name` → `identifier`.** Every update visitor (`updateAccountsVisitor`, `updateDefinedTypesVisitor`, `updateErrorsVisitor`, `updateInstructionsVisitor` and `updateProgramsVisitor`) renames with `identifier`, including instruction accounts and data fields. Selector keys and new identifiers are used as given rather than camelCased.
  
  ```diff
    updateInstructionsVisitor({
        send: {
  -         name: 'transfer',
  -         accounts: { owner: { name: 'authority' } },
  +         identifier: 'transfer',
  +         accounts: { owner: { identifier: 'authority' } },
        },
    });
  ```
  
  **Unknown keys throw.** An update containing an unrecognised key, such as v1's `name`, throws `CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS` instead of being silently ignored.
  
  **`arguments` → path-keyed `data`.** `updateInstructionsVisitor` updates the fields of the instruction's inline `data` struct, keyed by path, and `InstructionArgumentUpdates` is replaced by `InstructionDataUpdates`. Fields behind a `definedTypeLinkNode` cannot be updated since the defined type may be shared: unwrap it first. Default values must be `ValueNode`s, so contextual defaults are expressed with an `injectedValueNode` and a matching `provides` entry.
  
  ```diff
    updateInstructionsVisitor({
        transfer: {
  -         arguments: {
  -             amount: { defaultValue: numberValueNode(1) },
  -             bump: { defaultValue: accountBumpValueNode('vault') },
  -         },
  +         data: {
  +             amount: { defaultValue: integerValueNode('1') },
  +             'config.decimals': { identifier: 'mintDecimals' },
  +             bump: { defaultValue: injectedValueNode({ key: 'bump' }) },
  +         },
  +         provides: { bump: accountBumpValueNode('vault') },
        },
    });
  ```
  
  **`provides` merged by key.** `provides` is a record merged by identifier with the instruction's `ProvidedNode`s, where a `null` value removes an entry.
  
  **Missing targets throw.** Updating an instruction account or a data field that does not exist throws `CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND` or `CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND`. In v1, unknown arguments were silently added as extra arguments. Renaming a missing account field or defined type member throws `CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND` or `CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND`.
  
  **Updates are merged per node.** All entries matching a node, such as `transfer` and `myProgram.transfer`, are merged and applied at once against the original node, and a `delete` entry wins over the others. Nodes supplied by the updates, such as default values or provided nodes, must use the new identifiers.
  
  **Renames repoint every reference.** References are resolved through the linked nodes rather than matched by name, so links from other programs are handled and their `program` and other attributes are kept.
  
  - Renaming a program, account, PDA, defined type or instruction renames every link pointing to it. Renaming an account also renames the PDA of the same program sharing its identifier.
  - Renaming an instruction account repoints the `accountValueNode`, `accountBumpValueNode`, `accountDataValueNode`, `instructionAccountLinkNode` and `${accounts.…}` placeholders pointing to it.
  - Renaming instruction data fields, account data fields or struct fields of a defined type repoints every path going through them, such as `dataValueNode`s, `accountDataValueNode`s, `fieldDiscriminatorNode`s and `${data.…}` placeholders, following defined type links and crossing account links through `.data` segments (e.g. `mint.data.decimals`).
  - Renaming the variants of an enum defined type repoints the `enumValueNode`s of that type.

- [#1248](https://github.com/codama-idl/codama/pull/1248) [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Rename the visitors built around instruction arguments now that Codama v2 stores them as a struct in `instructionNode.data`, and remove the helpers that no longer apply.
  
  **BREAKING CHANGES**
  
  **Instruction argument visitors renamed.** Each visitor keeps its purpose but now operates on the instruction's `data`.
  
  ```diff
  - flattenInstructionDataArgumentsVisitor()
  + flattenInstructionDataVisitor()
  - unwrapInstructionArgsDefinedTypesVisitor()
  + unwrapInstructionDataDefinedTypesVisitor()
  - createSubInstructionsFromEnumArgsVisitor({ mint: 'mintArgs' })
  + createSubInstructionsFromEnumDataVisitor({ mint: 'mintArgs' })
  ```
  
  **`flattenInstructionArguments` removed.** The helper and its `FlattenInstructionArgumentsConfig` type are gone. Use `flattenStruct` on the instruction's `data` struct instead. `flattenInstructionDataVisitor` only flattens inline struct data: linked data is left untouched since the defined type may be shared, so run `unwrapInstructionDataDefinedTypesVisitor` first to flatten it.
  
  **Sub-instructions follow the enum.** `createSubInstructionsFromEnumDataVisitor` names each sub-instruction `${instruction}_${variant}` without any casing transformation, instead of camelCasing it. Its discriminator field is named `${instruction}_${variant}_discriminator`, uses the enum's `size` instead of always `u8`, and defaults to the variant's `discriminator` (falling back to its index). Struct payloads are inlined, and enums carrying transforms keep the discriminator and payload grouped in a struct carrying them, so the wire format is preserved. Both the instruction data and the enum field may be linked. It throws `CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND` when the instruction has no data, no such field, or a field that is not an enum.
  
  **Histogram keys renamed.** `DefinedTypeHistogram` is keyed by `program.type` identifiers, or by the type identifier alone outside of a program, rather than by camelCase names, and its counters follow the new data model.
  
  ```diff
    {
  -     directlyAsInstructionArgs: number;
  +     directlyAsInstructionData: number;
        inAccounts: number;
        inDefinedTypes: number;
        inEvents: number;
  -     inInstructionArgs: number;
  +     inInstructionData: number;
  +     inInstructionReturnData: number;
        total: number;
    }
  ```
  
  `directlyAsInstructionData` counts uses as an instruction's `data` itself or as the type of one of its top-level fields. `total` now counts every `definedTypeLinkNode`, including those in default values, PDA seeds and constants, and links with an explicit `program` are keyed by that program rather than the program they appear in.

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

- [#1248](https://github.com/codama-idl/codama/pull/1248) [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Adapt `setNumberWrappersVisitor`, `setInstructionDiscriminatorsVisitor`, `setInstructionAccountDefaultValuesVisitor` and `fillDefaultPdaSeedValuesVisitor` to the Codama v2 numeric system and instruction data.
  
  **BREAKING CHANGES**
  
  **New `NumberWrapper` kinds.** `setNumberWrappersVisitor` targets `integerTypeNode`s (and `floatTypeNode`s for `Unit` and `UnitDisplay`). The `Amount` wrapper is removed in favour of `FixedPoint`, and new kinds cover durations, units and displays.
  
  ```diff
    setNumberWrappersVisitor({
        lamports: { kind: 'SolAmount' },
  -     timestamp: { kind: 'DateTime' },
  -     supply: { kind: 'Amount', decimals: 6, unit: 'USDC' },
  +     timestamp: { kind: 'DateTime', ticksPerSecond: 1 },
  +     supply: { kind: 'FixedPoint', scale: 6, unit: 'USDC' },
  +     lockup: { kind: 'Duration' },
  +     percent: { kind: 'Unit', unit: '%' },
  +     amount: { kind: 'AmountDisplay', decimals: injectedValueNode({ key: 'decimals' }) },
    });
  ```
  
  `SolAmount` becomes a `fixedPointTypeNode` of scale 9 in `SOL`, and `AmountDisplay` and `UnitDisplay` set the number's `display`. Wrappers carry the `transforms` of the number they wrap, and integers used as sizes or prefixes, as well as numbers within the type of a constant, are left untouched. It throws `CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER` for an unknown kind, a zero fixed-point scale, a fixed point wrapping a `shortU16`, or a wrapped integer that already carries a `unit` or `display`.
  
  **`setInstructionDiscriminatorsVisitor` options.** The exported `InstructionDiscriminator` options use `identifier` instead of `name`, and unknown keys throw `CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS`. The `type` defaults to `integerTypeNode('u8')` and must have a fixed size.
  
  ```diff
    setInstructionDiscriminatorsVisitor({
  -     transfer: { name: 'kind', type: numberTypeNode('u32'), value: numberValueNode(1) },
  +     transfer: { identifier: 'kind', type: integerTypeNode('u32'), value: integerValueNode('1') },
    });
  ```
  
  The discriminator is added as the first field of inline struct data without transforms (or absent data), with a `fieldDiscriminatorNode`. Otherwise, such as for linked data or data with a size prefix, it is added as a `hiddenPrefixTransformNode` on the data with a `constantDiscriminatorNode`, leaving any shared defined type untouched. The offsets of existing field and constant discriminators and the size of existing size discriminators are shifted by the discriminator's size. It throws `CODAMA_ERROR__VISITORS__CANNOT_SET_INSTRUCTION_DISCRIMINATOR` if the data already has a field with that identifier, if the `optional` strategy is used with a hidden prefix, or if the type has no fixed size.
  
  **Exact account matching in `setInstructionAccountDefaultValuesVisitor`.** String `account` and `instruction` rules match identifiers exactly instead of after camelCasing. The rules from `getCommonInstructionAccountDefaultRules` match both the camelCase and snake_case identifiers of common accounts (e.g. `systemProgram` and `system_program`). Sub-instructions now get default values too, and the given rules array is no longer sorted in place. Only rules whose PDA seeds cannot all be filled are skipped: any other error is now thrown rather than swallowed.
  
  **`fillDefaultPdaSeedValuesVisitor` fills `dataValueNode`s.** Variable seeds that do not match an account are filled with a `dataValueNode` when the instruction's data has a top-level field with the seed's identifier, following defined type links, instead of an `argumentValueNode`. Seeds match accounts and fields by exact identifier, and other attributes of the `pdaValueNode` are kept.

- [#1248](https://github.com/codama-idl/codama/pull/1248) [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Adapt the remaining structural visitors to Codama v2 identifiers, flat transforms and plugins, matching identifiers exactly and refusing transformations that would silently lose information.
  
  **BREAKING CHANGES**
  
  **Exact identifier matching.** Identifiers given to `addPdasVisitor`, `flattenStructVisitor`, `setStructDefaultValuesVisitor`, `setAccountDiscriminatorFromFieldVisitor`, `transformDefinedTypesIntoAccountsVisitor` and `unwrapDefinedTypesVisitor` are matched exactly instead of after camelCasing, since v2 identifiers keep their casing.
  
  **camelCase collisions throw.** `addPdasVisitor` throws `CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES` when a new PDA shares a camelCase form with an existing or another new PDA of the same program. `flattenStruct` and `flattenStructVisitor` throw `CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES` when two resulting fields share a camelCase form, following the spec's casing-collision rule.
  
  **Flattening preserves the wire format.** `flattenStruct` keeps struct fields whose struct carries `transforms` as they are, and throws `CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS` when a struct to inline carries `plugins`. The flattened struct keeps its own attributes.
  
  **Inlining applies link transforms.** `unwrapDefinedTypesVisitor`, `unwrapTypeDefinedLinksVisitor` and `unwrapTupleEnumWithSingleStructVisitor` layer the `transforms` of the replaced link or tuple on top of the inlined type, and qualify the links inside a type inlined into another program with its original program.
  
  **Cyclic defined types are not inlined.** `unwrapDefinedTypesVisitor` keeps defined types in a cycle made only of types to inline, such as `node = struct { next: option<link(node)> }`, along with the links to them, since inlining them would never end.
  
  **Inline struct data required.** `setAccountDiscriminatorFromFieldVisitor` requires the account data to be an inline `structTypeNode`, since changing a linked defined type would affect every node using it. `setStructDefaultValuesVisitor` no longer has dedicated handling for instruction arguments: it updates the inline `data` struct of selected instructions like any other struct, and contextual defaults are expressed with an `injectedValueNode` and a matching `provides` entry.
  
  **Other behaviour changes.**
  
  - `addPdasVisitor` accepts full `PdaNodeInput`s, keeping every attribute such as `plugins`.
  - `deduplicateIdenticalDefinedTypesVisitor` repoints links to the removed copies at the kept one, and only treats types as identical when every defined type they link to without an explicit program is itself deduplicated across the same programs.
  - `transformDefinedTypesIntoAccountsVisitor` accepts defined types of any type, not only structs, and keeps their `docs` and `plugins`.
  - `transformU8ArraysToBytesVisitor` produces a `bytesTypeNode` with a `fixedSizeTransformNode`, only converts plain `u8` items (without `unit`, `display`, `transforms` or `plugins`) and keeps the array's own `transforms` and `plugins`.
  - `unwrapTupleEnumWithSingleStructVisitor` unwraps `enumVariantTypeNode`s whose data is a tuple with a single struct item or link to one, and removes the linked defined types that are no longer used.

### Minor Changes

- [#1221](https://github.com/codama-idl/codama/pull/1221) [`b869cef`](https://github.com/codama-idl/codama/commit/b869cefbe05a2ccd1fed9fb9750ad9de0abe66b8) Thanks [@tsiklic1](https://github.com/tsiklic1)! - Add `addProgramsVisitor` to append programs to a root node's additional programs, rejecting identifiers that collide with existing or other new programs after conversion to camelCase.

### Patch Changes

- [#1250](https://github.com/codama-idl/codama/pull/1250) [`cedeb1e`](https://github.com/codama-idl/codama/commit/cedeb1e45d0434219895cfa90a9cdf3410da7ac0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Keep the links of enum values in `unwrapDefinedTypesVisitor` and `unwrapTypeDefinedLinksVisitor`, along with the defined types they target, instead of throwing on any enum default value.

- [#1250](https://github.com/codama-idl/codama/pull/1250) [`cedeb1e`](https://github.com/codama-idl/codama/commit/cedeb1e45d0434219895cfa90a9cdf3410da7ac0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Repoint the data paths going through inlined fields in `flattenInstructionDataVisitor`, e.g. a `params.seed` PDA seed becomes `seed`. It no longer throws on conflicts: a struct field is kept nested, while the others are still inlined, when inlining it would produce conflicting fields or when a data path refers to it as a whole, e.g. a `params` PDA seed.
- Updated dependencies [[`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`1f0fb88`](https://github.com/codama-idl/codama/commit/1f0fb881c3334110ea673772dcdb832c1e3885df), [`3f76a7f`](https://github.com/codama-idl/codama/commit/3f76a7f841a195a86d1fa812ba1d781b1acb1a43), [`e1cce0d`](https://github.com/codama-idl/codama/commit/e1cce0d1b1841c82f58896381b628c2beb6962d6), [`64d52eb`](https://github.com/codama-idl/codama/commit/64d52eb19d4d853337fd1fbc3a874b1647e7960d), [`e92df74`](https://github.com/codama-idl/codama/commit/e92df74ea8495d419c74e5d42c4aa74293eae393), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`909960f`](https://github.com/codama-idl/codama/commit/909960ff465c07d0fa63f977fe01bb53c9111806), [`3f76a7f`](https://github.com/codama-idl/codama/commit/3f76a7f841a195a86d1fa812ba1d781b1acb1a43), [`bb09077`](https://github.com/codama-idl/codama/commit/bb09077c6f7e7590836d5c2f02c9fd7dca310b20), [`bb09077`](https://github.com/codama-idl/codama/commit/bb09077c6f7e7590836d5c2f02c9fd7dca310b20), [`277eae1`](https://github.com/codama-idl/codama/commit/277eae120b39ab578232e86547fda6281a928ddb), [`277eae1`](https://github.com/codama-idl/codama/commit/277eae120b39ab578232e86547fda6281a928ddb), [`3ad402a`](https://github.com/codama-idl/codama/commit/3ad402a5bf132263c989921f9e049468861319b7), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`277eae1`](https://github.com/codama-idl/codama/commit/277eae120b39ab578232e86547fda6281a928ddb), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`b869cef`](https://github.com/codama-idl/codama/commit/b869cefbe05a2ccd1fed9fb9750ad9de0abe66b8), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`08d72e7`](https://github.com/codama-idl/codama/commit/08d72e75f10c587091c6e3384acf3d3e2c09d391)]:
  - @codama/visitors-core@2.0.0-rc.0
  - @codama/errors@2.0.0-rc.0
  - @codama/fragments@2.0.0-rc.0
  - @codama/nodes@2.0.0-rc.0

## 1.11.0

### Minor Changes

- [#1096](https://github.com/codama-idl/codama/pull/1096) [`362f618`](https://github.com/codama-idl/codama/commit/362f618127d6642b3ec09d3016cb801629b2aa53) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `checkCodamaVersionVisitor`. It checks the version of the visited Codama IDL against the Codama spec version supported by the installed packages, throwing a `CODAMA_ERROR__VERSION_MISMATCH` error when the majors differ. It is mainly useful at IDL-ingestion boundaries that bypass `createFromRoot`, such as a `before` visitor in a Codama CLI config.

### Patch Changes

- Updated dependencies [[`fa4a453`](https://github.com/codama-idl/codama/commit/fa4a45315028a9cb125ebaf31695df82a6ffc1c6), [`abefbeb`](https://github.com/codama-idl/codama/commit/abefbeb3ae369b01a46794ca3824a23391548040), [`55b9ede`](https://github.com/codama-idl/codama/commit/55b9edef01767a29d7ebeeeaed3bd75610150e28), [`dabfe42`](https://github.com/codama-idl/codama/commit/dabfe42211380aa16109058142dec6b21ced3835), [`b418a9e`](https://github.com/codama-idl/codama/commit/b418a9e19b0b15a3dc1c79edb246d78694d6310e)]:
  - @codama/nodes@1.11.0
  - @codama/errors@1.11.0
  - @codama/visitors-core@1.11.0

## 1.10.2

### Patch Changes

- [#1081](https://github.com/codama-idl/codama/pull/1081) [`21c278c`](https://github.com/codama-idl/codama/commit/21c278c46a0e509095f7b88b0475280022bca794) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Correct error context types that could never match their runtime values, surfaced by type-aware linting: validation items and their node paths are now `readonly`, and the `CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY` context types its `dependency` as the dangling `AccountValueNode | ArgumentValueNode` reference it actually receives. The `CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND` context now carries the resolved enum type node instead of the defined type link, and account-field-not-found errors normalise the missing field name to camel case.
- Updated dependencies [[`21c278c`](https://github.com/codama-idl/codama/commit/21c278c46a0e509095f7b88b0475280022bca794)]:
  - @codama/errors@1.10.2
  - @codama/nodes@1.10.2
  - @codama/visitors-core@1.10.2

## 1.10.1

### Patch Changes

- Updated dependencies [[`f69845c`](https://github.com/codama-idl/codama/commit/f69845cb89ee0cc3877ee89a4b734386e9336074)]:
    - @codama/nodes@1.10.1
    - @codama/visitors-core@1.10.1
    - @codama/errors@1.10.1

## 1.10.0

### Patch Changes

- Updated dependencies [[`add9be2`](https://github.com/codama-idl/codama/commit/add9be28470d66ad2e99fab7688597ef7840cb4a), [`61ac0a6`](https://github.com/codama-idl/codama/commit/61ac0a6d426802d35d0fe0a1eb4fc92b33b0d8a9)]:
    - @codama/nodes@1.10.0
    - @codama/errors@1.10.0
    - @codama/visitors-core@1.10.0

## 1.9.0

### Patch Changes

- Updated dependencies [[`d3d9c1d`](https://github.com/codama-idl/codama/commit/d3d9c1dcab8be709b7047f7a259ad63f12cb160d)]:
    - @codama/nodes@1.9.0
    - @codama/visitors-core@1.9.0
    - @codama/errors@1.9.0

## 1.8.0

### Patch Changes

- Updated dependencies [[`0b3a781`](https://github.com/codama-idl/codama/commit/0b3a781c024b27397e17ad456f039f76382cb519), [`b1f6a75`](https://github.com/codama-idl/codama/commit/b1f6a75d9ff3a176c8977c6f9938b8a703bbad71)]:
    - @codama/nodes@1.8.0
    - @codama/visitors-core@1.8.0
    - @codama/errors@1.8.0

## 1.7.0

### Patch Changes

- Updated dependencies [[`d4aa3bf`](https://github.com/codama-idl/codama/commit/d4aa3bfdd1ec7db95710aeed28ce62db84f11655)]:
    - @codama/visitors-core@1.7.0
    - @codama/nodes@1.7.0
    - @codama/errors@1.7.0

## 1.6.0

### Patch Changes

- Updated dependencies [[`2428220`](https://github.com/codama-idl/codama/commit/2428220162766b7f0547cea8d5f617a93b06732d), [`6487af5`](https://github.com/codama-idl/codama/commit/6487af56598eee691a67c7e7966626ac6d0a2624)]:
    - @codama/errors@1.6.0
    - @codama/nodes@1.6.0
    - @codama/visitors-core@1.6.0

## 1.5.1

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.5.1
    - @codama/nodes@1.5.1
    - @codama/visitors-core@1.5.1

## 1.5.0

### Patch Changes

- Updated dependencies [[`e537ed3`](https://github.com/codama-idl/codama/commit/e537ed3a08e0fc0c57251ac2109f8499ad8e3803)]:
    - @codama/visitors-core@1.5.0
    - @codama/nodes@1.5.0
    - @codama/errors@1.5.0

## 1.4.4

### Patch Changes

- [#944](https://github.com/codama-idl/codama/pull/944) [`6ad73e4`](https://github.com/codama-idl/codama/commit/6ad73e44a8c866706483a0da3280479324903307) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Enable Rollup treeshaking pass by default, disable only for CLI builds

- Updated dependencies [[`6ad73e4`](https://github.com/codama-idl/codama/commit/6ad73e44a8c866706483a0da3280479324903307)]:
    - @codama/errors@1.4.4
    - @codama/nodes@1.4.4
    - @codama/visitors-core@1.4.4

## 1.4.3

### Patch Changes

- [#942](https://github.com/codama-idl/codama/pull/942) [`ef5d104`](https://github.com/codama-idl/codama/commit/ef5d104af0746d46a41a2733f1cd5600c538aad9) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove treeshake workaround for Rollup's deprecated assert syntax

- Updated dependencies [[`ef5d104`](https://github.com/codama-idl/codama/commit/ef5d104af0746d46a41a2733f1cd5600c538aad9)]:
    - @codama/errors@1.4.3
    - @codama/nodes@1.4.3
    - @codama/visitors-core@1.4.3

## 1.4.2

### Patch Changes

- Updated dependencies [[`5ec491f`](https://github.com/codama-idl/codama/commit/5ec491f446e37cbb98407dc16b608fd2a649be00)]:
    - @codama/errors@1.4.2
    - @codama/nodes@1.4.2
    - @codama/visitors-core@1.4.2

## 1.4.1

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.4.1
    - @codama/nodes@1.4.1
    - @codama/visitors-core@1.4.1

## 1.4.0

### Patch Changes

- Updated dependencies [[`5c3fb46`](https://github.com/codama-idl/codama/commit/5c3fb46cf5898ec9130d1f29bd7a876fcef19128)]:
    - @codama/nodes@1.4.0
    - @codama/errors@1.4.0
    - @codama/visitors-core@1.4.0

## 1.3.8

### Patch Changes

- Updated dependencies [[`07825de`](https://github.com/codama-idl/codama/commit/07825dec4cbd9d773f3197a46964dfb38d63d80e)]:
    - @codama/errors@1.3.8
    - @codama/nodes@1.3.8
    - @codama/visitors-core@1.3.8

## 1.3.7

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.7
    - @codama/nodes@1.3.7
    - @codama/visitors-core@1.3.7

## 1.3.6

### Patch Changes

- Updated dependencies [[`a62b4c5`](https://github.com/codama-idl/codama/commit/a62b4c5701b92642b8e4069953969f1f9c3dd20c)]:
    - @codama/errors@1.3.6
    - @codama/nodes@1.3.6
    - @codama/visitors-core@1.3.6

## 1.3.5

### Patch Changes

- Updated dependencies [[`8638fa7`](https://github.com/codama-idl/codama/commit/8638fa7b9b81ca4fb2ad895ec52221a1804649fe), [`0bb08e6`](https://github.com/codama-idl/codama/commit/0bb08e64855ec4671b263dd6c145bb8567eefb94)]:
    - @codama/visitors-core@1.3.5
    - @codama/errors@1.3.5
    - @codama/nodes@1.3.5

## 1.3.4

### Patch Changes

- Updated dependencies [[`1f9f614`](https://github.com/codama-idl/codama/commit/1f9f614d3ed02439135a6037343f139e8a127c48)]:
    - @codama/visitors-core@1.3.4
    - @codama/errors@1.3.4
    - @codama/nodes@1.3.4

## 1.3.3

### Patch Changes

- [#778](https://github.com/codama-idl/codama/pull/778) [`a32c424`](https://github.com/codama-idl/codama/commit/a32c42450bea12a53ccc120e5bcee1c20868f4e0) Thanks [@macalinao](https://github.com/macalinao)! - Allow specifying docs for PDA nodes in addPdasVisitor

- Updated dependencies []:
    - @codama/errors@1.3.3
    - @codama/nodes@1.3.3
    - @codama/visitors-core@1.3.3

## 1.3.2

### Patch Changes

- [#747](https://github.com/codama-idl/codama/pull/747) [`99c299d`](https://github.com/codama-idl/codama/commit/99c299d65eb354100d97553111d85c73109533e7) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Allow updating more fields in `updateInstructionsVisitor`

- Updated dependencies [[`b912ac8`](https://github.com/codama-idl/codama/commit/b912ac89b2d041c1f783da8d6f023fdf77dbd7e7)]:
    - @codama/visitors-core@1.3.2
    - @codama/errors@1.3.2
    - @codama/nodes@1.3.2

## 1.3.1

### Patch Changes

- Updated dependencies [[`71caa87`](https://github.com/codama-idl/codama/commit/71caa87d7010ecfeed5fb08e79955e5a7e8c0779)]:
    - @codama/visitors-core@1.3.1
    - @codama/errors@1.3.1
    - @codama/nodes@1.3.1

## 1.3.0

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.0
    - @codama/nodes@1.3.0
    - @codama/visitors-core@1.3.0

## 1.2.13

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.13
    - @codama/nodes@1.2.13
    - @codama/visitors-core@1.2.13

## 1.2.12

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.12
    - @codama/nodes@1.2.12
    - @codama/visitors-core@1.2.12

## 1.2.11

### Patch Changes

- Updated dependencies [[`5071455`](https://github.com/codama-idl/codama/commit/5071455b05359fc427c1d6295e7abb0e39503a15)]:
    - @codama/visitors-core@1.2.11
    - @codama/nodes@1.2.11
    - @codama/errors@1.2.11

## 1.2.10

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.10
    - @codama/nodes@1.2.10
    - @codama/visitors-core@1.2.10

## 1.2.9

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.9
    - @codama/nodes@1.2.9
    - @codama/visitors-core@1.2.9

## 1.2.8

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.8
    - @codama/nodes@1.2.8
    - @codama/visitors-core@1.2.8

## 1.2.7

### Patch Changes

- Updated dependencies [[`7e275ab`](https://github.com/codama-idl/codama/commit/7e275ab51c6d1b20b54ea9f4976b0692a308b2d2)]:
    - @codama/errors@1.2.7
    - @codama/nodes@1.2.7
    - @codama/visitors-core@1.2.7

## 1.2.6

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.6
    - @codama/nodes@1.2.6
    - @codama/visitors-core@1.2.6

## 1.2.5

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.5
    - @codama/nodes@1.2.5
    - @codama/visitors-core@1.2.5

## 1.2.4

### Patch Changes

- Updated dependencies [[`f0c2190`](https://github.com/codama-idl/codama/commit/f0c219076af58c098319f4ca9494a98e198d99a1)]:
    - @codama/errors@1.2.4
    - @codama/nodes@1.2.4
    - @codama/visitors-core@1.2.4

## 1.2.3

### Patch Changes

- Updated dependencies [[`4ceeb5e`](https://github.com/codama-idl/codama/commit/4ceeb5e6c479690fe878d25af6a5d48953adfa6a)]:
    - @codama/errors@1.2.3
    - @codama/nodes@1.2.3
    - @codama/visitors-core@1.2.3

## 1.2.2

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.2
    - @codama/nodes@1.2.2
    - @codama/visitors-core@1.2.2

## 1.2.1

### Patch Changes

- Updated dependencies [[`92efaa9`](https://github.com/codama-idl/codama/commit/92efaa9261f38de10a1b691c5b25ea0ecf95360b)]:
    - @codama/errors@1.2.1
    - @codama/nodes@1.2.1
    - @codama/visitors-core@1.2.1

## 1.2.0

### Minor Changes

- [#314](https://github.com/codama-idl/codama/pull/314) [`e55bcd7`](https://github.com/codama-idl/codama/commit/e55bcd7ee7462cb485ec8642e46208072c437f2b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use program names when unwrapping link nodes

- [#362](https://github.com/codama-idl/codama/pull/362) [`d956af2`](https://github.com/codama-idl/codama/commit/d956af2db05b9499e6836b765599cacb20e179b9) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Transform all u8 arrays by default in `transformU8ArraysToBytesVisitor`

### Patch Changes

- [#334](https://github.com/codama-idl/codama/pull/334) [`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump dependencies

- Updated dependencies [[`a3225b0`](https://github.com/codama-idl/codama/commit/a3225b0e68e59746f911865653bb1d05c3aec22b), [`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7)]:
    - @codama/nodes@1.2.0
    - @codama/visitors-core@1.2.0
    - @codama/errors@1.2.0

## 1.1.0

### Minor Changes

- [#281](https://github.com/codama-idl/codama/pull/281) [`c78f3ca`](https://github.com/codama-idl/codama/commit/c78f3ca2291d1b6aed48e65dece9f97bc8b27c03) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use `NodePaths` in `fillDefaultPdaSeedValuesVisitor`

- [#280](https://github.com/codama-idl/codama/pull/280) [`c31eea8`](https://github.com/codama-idl/codama/commit/c31eea83c3f8659094324acc2b780054d72b7e90) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use `NodePaths` in `NodeSelectors`

- [#283](https://github.com/codama-idl/codama/pull/283) [`5bdd745`](https://github.com/codama-idl/codama/commit/5bdd745b313c4611fbc75e3eb03e368c4905ffce) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix LinkNode paths for `unwrapDefinedTypesVisitor`

- [#285](https://github.com/codama-idl/codama/pull/285) [`ce4936c`](https://github.com/codama-idl/codama/commit/ce4936c031a2ba07f1bdb52cab8debcfec810d8c) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow passing `NodeStacks` to nested visitors

### Patch Changes

- Updated dependencies [[`c31eea8`](https://github.com/codama-idl/codama/commit/c31eea83c3f8659094324acc2b780054d72b7e90), [`81dedc1`](https://github.com/codama-idl/codama/commit/81dedc195feab40bfc3aa676a633a8340ad56e24), [`4799a7f`](https://github.com/codama-idl/codama/commit/4799a7f291677304823aa206bed64baabc20eb5b), [`1f52f00`](https://github.com/codama-idl/codama/commit/1f52f00ba2a75a783879abfbaf4397c3e04e4db4), [`ce4936c`](https://github.com/codama-idl/codama/commit/ce4936c031a2ba07f1bdb52cab8debcfec810d8c), [`e95783b`](https://github.com/codama-idl/codama/commit/e95783bf02fd12327ca5b6f1c1c4e50e189dd241)]:
    - @codama/visitors-core@1.1.0
    - @codama/errors@1.1.0
    - @codama/nodes@1.1.0

## 1.0.0

### Major Changes

- [#236](https://github.com/codama-idl/codama/pull/236) [`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Publish codama v1 packages

### Patch Changes

- Updated dependencies [[`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8)]:
    - @codama/errors@1.0.0
    - @codama/nodes@1.0.0
    - @codama/visitors-core@1.0.0

## 0.22.0

### Minor Changes

- [#175](https://github.com/codama-idl/codama/pull/175) [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `importFrom` attributes from link nodes and resolvers

    Instead, a new `linkOverrides` attribute is introduced on all renderers to redirect a link node or a resolver to a custom path or module.

### Patch Changes

- [#180](https://github.com/codama-idl/codama/pull/180) [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add optional `program` attribute to link nodes and namespace linkable nodes under their associated program.

- Updated dependencies [[`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925), [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540), [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b)]:
    - @codama/visitors-core@0.22.0
    - @codama/errors@0.22.0
    - @codama/nodes@0.22.0

## 0.21.5

### Patch Changes

- Updated dependencies [[`a6849d3`](https://github.com/codama-idl/codama/commit/a6849d36a828e2b6b703f2a86d2ea0ae6d2fa0d8)]:
    - @codama/errors@0.21.5
    - @codama/nodes@0.21.5
    - @codama/visitors-core@0.21.5

## 0.21.4

### Patch Changes

- Updated dependencies []:
    - @codama/errors@0.21.4
    - @codama/nodes@0.21.4
    - @codama/visitors-core@0.21.4

## 0.21.3

### Patch Changes

- Updated dependencies [[`59ceb1d`](https://github.com/codama-idl/codama/commit/59ceb1d7803307b3a1a5e23ea3267934ad87bfc6)]:
    - @codama/visitors-core@0.21.3
    - @codama/errors@0.21.3
    - @codama/nodes@0.21.3

## 0.21.2

### Patch Changes

- Updated dependencies [[`23e3dc2`](https://github.com/codama-idl/codama/commit/23e3dc2da6072fefc40e8205c19e44b646aa40a0), [`33de843`](https://github.com/codama-idl/codama/commit/33de84386af661dc870b248b5301dafe1df2aba2)]:
    - @codama/visitors-core@0.21.2
    - @codama/errors@0.21.2
    - @codama/nodes@0.21.2

## 0.21.1

### Patch Changes

- Updated dependencies [[`2e8ce36`](https://github.com/codama-idl/codama/commit/2e8ce36af43a853673b0805c86a62672869de487)]:
    - @codama/visitors-core@0.21.1
    - @codama/errors@0.21.1
    - @codama/nodes@0.21.1

## 0.21.0

### Patch Changes

- Updated dependencies [[`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f)]:
    - @codama/visitors-core@0.21.0
    - @codama/errors@0.21.0
    - @codama/nodes@0.21.0

## 0.20.6

### Patch Changes

- Updated dependencies [[`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f)]:
    - @codama/errors@0.20.6
    - @codama/nodes@0.20.6
    - @codama/visitors-core@0.20.6

## 0.20.5

### Patch Changes

- Updated dependencies [[`908acba`](https://github.com/codama-idl/codama/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8), [`88572e8`](https://github.com/codama-idl/codama/commit/88572e8eaffe09b5b8c48c4e9aebfdeb8bc149e6)]:
    - @codama/errors@0.20.5
    - @codama/nodes@0.20.5
    - @codama/visitors-core@0.20.5

## 0.20.4

### Patch Changes

- [#43](https://github.com/codama-idl/codama/pull/43) [`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow PdaValueNode to inline their own PdaNode definition

- Updated dependencies [[`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
    - @codama/nodes@0.20.4
    - @codama/errors@0.20.4
    - @codama/visitors-core@0.20.4

## 0.20.3

### Patch Changes

- Updated dependencies [[`d938e04`](https://github.com/codama-idl/codama/commit/d938e04b8cf5765c5bb2b68916b29e892fd5ad70), [`4bc5823`](https://github.com/codama-idl/codama/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c)]:
    - @codama/visitors-core@0.20.3
    - @codama/errors@0.20.3
    - @codama/nodes@0.20.3

## 0.20.2

### Patch Changes

- [`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

- Updated dependencies [[`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e)]:
    - @codama/errors@0.20.2
    - @codama/nodes@0.20.2
    - @codama/visitors-core@0.20.2

## 0.20.1

### Patch Changes

- Updated dependencies [[`0dec0c8`](https://github.com/codama-idl/codama/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0)]:
    - @codama/errors@0.20.1
    - @codama/nodes@0.20.1
    - @codama/visitors-core@0.20.1
