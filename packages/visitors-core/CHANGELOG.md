# @codama/visitors-core

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

- [#1251](https://github.com/codama-idl/codama/pull/1251) [`277eae1`](https://github.com/codama-idl/codama/commit/277eae120b39ab578232e86547fda6281a928ddb) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Stop exporting the test-only `NODE_TEST_PATHS` constant.
  
  **BREAKING CHANGES**
  
  **`NODE_TEST_PATHS` removed.** This test-only constant, mapping each node kind to its test fixture path, is no longer exported from `@codama/visitors-core`.
  
  ```diff
  - import { NODE_TEST_PATHS } from '@codama/visitors-core';
  ```

- [#1251](https://github.com/codama-idl/codama/pull/1251) [`277eae1`](https://github.com/codama-idl/codama/commit/277eae120b39ab578232e86547fda6281a928ddb) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Clear the `LinkableDictionary` before each top-level visit of `recordLinkablesOnFirstVisitVisitor`, so a reused visitor no longer resolves links against previously visited trees. Also add a `LinkableDictionary.clear()` method.
  
  **BREAKING CHANGES**
  
  **`recordLinkablesOnFirstVisitVisitor` clears its dictionary.** `recordLinkablesOnFirstVisitVisitor` clears the dictionary before each top-level visit, so linkables recorded into it beforehand are discarded; record extra linkables inside the visitor instead.

- [#1260](https://github.com/codama-idl/codama/pull/1260) [`3ad402a`](https://github.com/codama-idl/codama/commit/3ad402a5bf132263c989921f9e049468861319b7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Require Node.js 22.12.0 or later.
  
  **BREAKING CHANGES**
  
  **Node.js 20 is no longer supported.** Every package now declares `"engines": { "node": ">=22.12.0" }`, the first Node.js 22 release that supports `require(esm)` by default. Node.js 20 reached its end of life in April 2026, and some dependencies (e.g. `commander`) already require Node.js 22.12.0.

- [#1248](https://github.com/codama-idl/codama/pull/1248) [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `ProvidedScope` to resolve `injectedValueNode`s from the `provides` of enclosing instructions, add `getInstructionDataFields`, and rework `getResolvedInstructionInputsVisitor` around instruction data fields and injected values.
  
  - `ProvidedScope` holds the lexical frames of `providedNode`s visible at a point of the tree, one per `instructionNode` with `provides`, the innermost frame winning. `scope.resolve(node, { kinds })` replaces every injection within `node` (itself included), using fallbacks when nothing is provided, and returns `undefined` when an injection resolves to nothing. `scope.resolveOrThrow(node, { kinds })` throws `CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED` instead. Resolved values of the wrong kind throw `CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE`. `scope.get(key)`, `push`, `pop` and `clone` are also available.
  - `recordProvidedScopeVisitor(visitor, scope)` keeps a `ProvidedScope` in sync with a traversal, and `getProvidedScopeFromPath(path)` builds the scope of the instructions along a path.
  - `getInstructionDataFields(instructionPath, linkables)` lists every struct field addressable within an instruction's `data`, with its full path (`InstructionDataField`), e.g. `amount`, `config` and `config.fee`, following defined type links.
  
  **BREAKING CHANGES**
  
  **`getResolvedInstructionInputsVisitor` takes a `LinkableDictionary`.** It is now its first argument, used to follow defined type links in the instruction's `data`. Its options gain `stack` (the ancestry of the visited instruction, which must contain its `programNode` for linked data to be followed) and `scope` (the `ProvidedScope` of enclosing instructions), and `includeDataArgumentValueNodes` is renamed `includeDataValueNodes`.
  
  ```diff
  - visit(instruction, getResolvedInstructionInputsVisitor({ includeDataArgumentValueNodes: true }));
  + visit(instruction, getResolvedInstructionInputsVisitor(linkables, { includeDataValueNodes: true, stack }));
  ```
  
  **Resolved inputs wrap their node.** `ResolvedInstructionAccount` no longer extends `InstructionAccountNode`: the account is under `node`, alongside `dependsOn`, `isPda`, `resolvedIsOptional`, `resolvedIsSigner` and a new `resolvedDefaultValue` with injections resolved. `ResolvedInstructionArgument` is replaced by `ResolvedInstructionDataField` (`node`, `path`, `dependsOn`, `resolvedDefaultValue`), for the fields of the instruction's `data`, nested fields included, addressed by their path (e.g. `config.bump`).
  
  ```diff
  - resolvedInputs.map(input => input.name);
  + resolvedInputs.map(input => (isNode(input.node, 'instructionAccountNode') ? input.node.identifier : input.path));
  ```
  
  **Instruction dependencies are data values.** `InstructionDependency` is now exported and is `AccountValueNode | DataValueNode` (previously `AccountValueNode | ArgumentValueNode`), and `getInstructionDependencies(input)` is replaced by `getDependencies(defaultValue)`, which takes the default value to inspect rather than an instruction or input.

- [#1248](https://github.com/codama-idl/codama/pull/1248) [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `resolveTypePath` to follow path expressions such as `config.fees[0]` through types, and `isValueNodeOfType` to check a value node against a type. `NodePath` no longer distributes over node unions, `nodePathToString` renders paths like error messages do, and node selectors match identifiers exactly.
  
  New helpers:
  
  - `resolveTypePath(source, path, linkables, options?)` resolves a `PathString` against the type at the end of `source` and returns the full path of the node it points to: field segments select struct fields, index segments select tuple items or the item of an array or set, and defined type links are followed to their definitions. With `{ followAccountLinks: true }` (`ResolveTypePathOptions`), a `.data` segment on a public key carrying an `accountLink` continues into the linked account's data, e.g. `mint.data.decimals`. It throws `CODAMA_ERROR__CANNOT_RESOLVE_PATH` when a segment cannot be followed.
  - `parsePath(path)` splits a path expression into `PathSegment`s (`{ kind: 'field', identifier }` or `{ kind: 'index', index }`).
  - `TypePathNode` (a registered type node or a `definedTypeLinkNode`) and `TypePath`, a path ending at one.
  - `isValueNodeOfType(value, typePath, linkables)` tells whether a concrete value node structurally fits the type at the end of `typePath`, following defined type links, e.g. `noneValueNode()` for an `optionTypeNode`.
  - `assertNodePathHasProgram(path)` throws `CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING` when a path has no `programNode` to resolve links from.
  
  **BREAKING CHANGES**
  
  **`NodePath` is no longer distributive.** `NodePath<A | B>` is now one path ending at `A | B` rather than the union `NodePath<A> | NodePath<B>`, so paths built from nodes only known as a union, e.g. `[...stack.getPath(), node]`, type-check. Parameters typed as `NodePath<A> | NodePath<B>` no longer accept such paths and should use `NodePath<A | B>`.
  
  ```diff
  - function visitLink(path: NodePath<AccountLinkNode> | NodePath<PdaLinkNode>) {}
  + function visitLink(path: NodePath<AccountLinkNode | PdaLinkNode>) {}
  ```
  
  **`nodePathToString` output changed.** It now renders paths like `getNodePathString` from `@codama/errors`: node selectors joined by dots, leaving out a leading `rootNode`. `nodePathToStringArray` renders each node with its `identifier`.
  
  ```diff
  - nodePathToString(path); // '[rootNode] > [programNode]token > [accountNode]mint'
  + nodePathToString(path); // '[programNode]token.[accountNode]mint'
  ```
  
  **Node selectors match identifiers exactly.** The name part of a `NodeSelectorPath`, e.g. `mint_authority` in `[instructionAccountNode]mint_authority`, is no longer converted to camelCase before being compared, and is matched against the node's `identifier`.

- [#1158](https://github.com/codama-idl/codama/pull/1158) [`08d72e7`](https://github.com/codama-idl/codama/commit/08d72e75f10c587091c6e3384acf3d3e2c09d391) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Regenerate the node types, constructors and core visitors from the Codama v2 spec (`@codama/spec@2`).
  
  The node model changes substantially from v1:
  
  - **`name` → `identifier`.** Every named node (`programNode`, `accountNode`, `instructionNode`, links, …) now carries `identifier` instead of `name`, and identifiers preserve their casing — v2 no longer mandates camelCase (`transfer_tokens` and `transferTokens` are both valid; uniqueness is resolved by case-folding).
  - **Numeric system rework.** `numberTypeNode`/`numberValueNode` split into `integerTypeNode`/`floatTypeNode` and `integerValueNode`/`floatValueNode` (numeric values are string-encoded to stay lossless through JSON). `amountTypeNode`/`solAmountTypeNode` become `fixedPointTypeNode`; new `durationTypeNode`; `dateTimeTypeNode`/`durationTypeNode` carry `ticksPerSecond`.
  - **Flat transforms.** The wrapper type nodes (`fixedSizeTypeNode`, `sizePrefixTypeNode`, `pre/postOffsetTypeNode`, `sentinelTypeNode`, `hiddenPrefix/SuffixTypeNode`) are removed; every type node instead carries an optional `transforms: transformNode[]` applied innermost-first.
  - **Instruction data.** `instructionArgumentNode`, `instructionArgumentLinkNode`, `resolverValueNode` and `instructionNode.arguments`/`extraArguments` are removed; instruction arguments live in `instructionNode.data`, reached via path expressions. `argumentValueNode` → `dataValueNode`; `accountFieldValueNode` → `accountDataValueNode`.
  - **Enum variants unified.** The three variant nodes collapse into a single `enumVariantTypeNode` with an optional `data`.
  - **Text and docs.** `docs` and text-bearing attributes are the union `string | textNode`; a `textNode` carries structured metadata (plugins). New `textNode`.
  - **Universal plugins.** Every node gains an optional `plugins: pluginNode[]` base attribute — the extension point for renderer-specific or not-yet-standardised metadata.
  - **Other.** `programNode.origin` removed (provenance moves to plugins); `pluginNode.name` → `pluginNode.namespace`; `sentinelCountNode` added; path expressions for field references and discriminators.
  
  Node factory ergonomics: trailing optional parameters now live in the constructor's `options` bag (e.g. `constantNode(identifier, type, value, { docs })`, `accountLinkNode(identifier, { program })`).

### Minor Changes

- [#1248](https://github.com/codama-idl/codama/pull/1248) [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `NodeStack` helpers to jump to other parts of the tree, pass the visitor itself to interceptors, and add helpers to record and list linkable nodes.
  
  - `stack.withPath(path, callback)` runs `callback` with `path` as the current path, then restores the previous one, even if `callback` throws.
  - `stack.visitPath(path, visitor)` visits the last node of `path` with the rest of `path` as the current path, e.g. to visit the definition of a linked node: `stack.visitPath(linkables.getPathOrThrow(linkPath), self)`.
  - `VisitorInterceptor` callbacks, used by `interceptVisitor` and `interceptFirstVisitVisitor`, receive the intercepted visitor as a third `self` argument, so they can visit other nodes with the whole visitor.
  - `getLinkablesFromNode(node)` records the linkable nodes under a node into a new `LinkableDictionary`, replacing `new LinkableDictionary()` followed by `visit(node, getRecordLinkablesVisitor(linkables))`.
  - `linkables.getRecordedPathsOfKind(kind)` lists the paths of every recorded linkable node of a kind, across all programs, e.g. `getRecordedPathsOfKind('accountNode')`.
  
  Also fix two `NodeStack` issues: `recordNodeStackVisitor` now restores the stack when a visit throws, and visitors following links (`getByteSizeVisitor`, `getMaxByteSizeVisitor`) no longer put the linked node twice on the path.

- [#1248](https://github.com/codama-idl/codama/pull/1248) [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add helpers to detect cyclic defined types and defined types without any finite value, and fix cycle detection in the byte-size visitors across programs.
  
  - `getDefinedTypeLinksVisitor(linkables, { stack? })` lists the paths of the defined types a node links to, without following these links.
  - `getHasFiniteValueVisitor(linkables, { stack? })` tells whether a type has at least one finite value, following links: options, enums and collections without a fixed positive count stop a recursion, whereas a link back to a type being visited (e.g. `loop = struct { next: link(loop) }`) or an enum without variants has none.
  - `isDefinedTypeCyclic(path, linkables)` tells whether a defined type links back to itself, directly or through other defined types.
  - `hasDefinedTypeFiniteValue(path, linkables)` tells whether a defined type has at least one finite value.
  
  `isDefinedTypeCyclic` and `hasDefinedTypeFiniteValue` resolve links from the program of the given path and throw `CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING` when it has none.
  
  `getByteSizeVisitor` and `getMaxByteSizeVisitor` now track the defined types being visited by node rather than by name, so a link to a same-named type of another program is no longer mistaken for a cycle, and links back to a type being visited still return `null`.

### Patch Changes

- [#1251](https://github.com/codama-idl/codama/pull/1251) [`277eae1`](https://github.com/codama-idl/codama/commit/277eae120b39ab578232e86547fda6281a928ddb) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix `ProvidedScope` resolving the fallback of a nested injection before the injection itself, which reported the fallback's key as missing even when the injection's own key was provided.
- Updated dependencies [[`1f0fb88`](https://github.com/codama-idl/codama/commit/1f0fb881c3334110ea673772dcdb832c1e3885df), [`3f76a7f`](https://github.com/codama-idl/codama/commit/3f76a7f841a195a86d1fa812ba1d781b1acb1a43), [`e1cce0d`](https://github.com/codama-idl/codama/commit/e1cce0d1b1841c82f58896381b628c2beb6962d6), [`64d52eb`](https://github.com/codama-idl/codama/commit/64d52eb19d4d853337fd1fbc3a874b1647e7960d), [`e92df74`](https://github.com/codama-idl/codama/commit/e92df74ea8495d419c74e5d42c4aa74293eae393), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`909960f`](https://github.com/codama-idl/codama/commit/909960ff465c07d0fa63f977fe01bb53c9111806), [`3f76a7f`](https://github.com/codama-idl/codama/commit/3f76a7f841a195a86d1fa812ba1d781b1acb1a43), [`bb09077`](https://github.com/codama-idl/codama/commit/bb09077c6f7e7590836d5c2f02c9fd7dca310b20), [`bb09077`](https://github.com/codama-idl/codama/commit/bb09077c6f7e7590836d5c2f02c9fd7dca310b20), [`3ad402a`](https://github.com/codama-idl/codama/commit/3ad402a5bf132263c989921f9e049468861319b7), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`b869cef`](https://github.com/codama-idl/codama/commit/b869cefbe05a2ccd1fed9fb9750ad9de0abe66b8), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`7f8beda`](https://github.com/codama-idl/codama/commit/7f8beda9e468638f05b9c5de20c8ea80a5d740a7), [`08d72e7`](https://github.com/codama-idl/codama/commit/08d72e75f10c587091c6e3384acf3d3e2c09d391)]:
  - @codama/errors@2.0.0-rc.0
  - @codama/fragments@2.0.0-rc.0
  - @codama/nodes@2.0.0-rc.0

## 1.11.0

### Patch Changes

- Updated dependencies [[`fa4a453`](https://github.com/codama-idl/codama/commit/fa4a45315028a9cb125ebaf31695df82a6ffc1c6), [`abefbeb`](https://github.com/codama-idl/codama/commit/abefbeb3ae369b01a46794ca3824a23391548040), [`55b9ede`](https://github.com/codama-idl/codama/commit/55b9edef01767a29d7ebeeeaed3bd75610150e28), [`dabfe42`](https://github.com/codama-idl/codama/commit/dabfe42211380aa16109058142dec6b21ced3835), [`b418a9e`](https://github.com/codama-idl/codama/commit/b418a9e19b0b15a3dc1c79edb246d78694d6310e)]:
  - @codama/nodes@1.11.0
  - @codama/errors@1.11.0

## 1.10.2

### Patch Changes

- Updated dependencies [[`21c278c`](https://github.com/codama-idl/codama/commit/21c278c46a0e509095f7b88b0475280022bca794)]:
  - @codama/errors@1.10.2
  - @codama/nodes@1.10.2

## 1.10.1

### Patch Changes

- Updated dependencies [[`f69845c`](https://github.com/codama-idl/codama/commit/f69845cb89ee0cc3877ee89a4b734386e9336074)]:
    - @codama/nodes@1.10.1
    - @codama/errors@1.10.1

## 1.10.0

### Patch Changes

- Updated dependencies [[`add9be2`](https://github.com/codama-idl/codama/commit/add9be28470d66ad2e99fab7688597ef7840cb4a), [`61ac0a6`](https://github.com/codama-idl/codama/commit/61ac0a6d426802d35d0fe0a1eb4fc92b33b0d8a9)]:
    - @codama/nodes@1.10.0
    - @codama/errors@1.10.0

## 1.9.0

### Patch Changes

- Updated dependencies [[`d3d9c1d`](https://github.com/codama-idl/codama/commit/d3d9c1dcab8be709b7047f7a259ad63f12cb160d)]:
    - @codama/nodes@1.9.0
    - @codama/errors@1.9.0

## 1.8.0

### Minor Changes

- [#1000](https://github.com/codama-idl/codama/pull/1000) [`b1f6a75`](https://github.com/codama-idl/codama/commit/b1f6a75d9ff3a176c8977c6f9938b8a703bbad71) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Regenerate `identityVisitor` and `mergeVisitor` from `@codama/spec` via the new `visitorsCore` generator in `@codama-internal/spec-generators`. Both visitors previously lived as ~1100 lines of hand-written per-node dispatch; the mechanical walk now lives under `src/generated/`. `src/identityVisitor.ts` is now a thin wrapper layering six semantic overrides (enum-variant empty-downgrade, hidden-prefix/suffix empty-bypass, conditional-value null-collapse, resolver empty-dependsOn collapse) via `extendVisitor`; `src/mergeVisitor.ts` ships directly from the generated tree.

    Three behaviour changes shake out:
    - **`enumTypeNode.size` and `pdaValueNode.programId` are now actually walked by `identityVisitor`.** The hand-written code passed both through unchanged, silently dropping any caller-applied transforms.
    - **Every required-array child attribute now uniformly tolerates `undefined` at runtime.** The hand-written guard previously applied only to `programNode.events` and `programNode.constants`. Making it uniform lets `identityVisitor` safely normalise a partial IDL JSON parsed via `createFromJson`. A follow-up PR will promote the affected `programNode` children to `optionalAttribute(...)` on the spec side, after which the guard becomes naturally derivable from the spec.
    - **`enumStructVariantTypeNode.discriminator` and `enumTupleVariantTypeNode.discriminator` are now preserved** when the variant survives the wrapper's empty-downgrade.

### Patch Changes

- [#997](https://github.com/codama-idl/codama/pull/997) [`0b3a781`](https://github.com/codama-idl/codama/commit/0b3a781c024b27397e17ad456f039f76382cb519) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Regenerate the `xxxNodeInput` types and `xxxNode()` constructors of `@codama/nodes` from the encoded `@codama/spec` description, via a new `nodes` generator inside `@codama-internal/spec-generators`. The runtime `*_NODE_KINDS` arrays (`STANDALONE_TYPE_NODE_KINDS`, `REGISTERED_VALUE_NODE_KINDS`, `INSTRUCTION_INPUT_VALUE_NODE_KINDS`, …, and the top-level `REGISTERED_NODE_KINDS`) are now generated from the spec's union definitions instead of being maintained by hand. A new top-level `CODAMA_VERSION` constant, typed as `CodamaVersion` and pinned to the spec version at generation time, is the single source of truth for the version `@codama/nodes` was built against — `rootNode()` reads it directly when tagging the document.

    The bulk of the surface lives under `packages/nodes/src/generated/` and is produced on every `pnpm generate` run. The previously hand-maintained constructors and kinds-arrays are gone; only hand-written helpers (`isNode`, `assertIsNode`, `getAllPrograms`, `getAllInstructions`, `getAllInstructionsWithSubs`, `isScalarEnum`, `isDataEnum`, `isSignedInteger`, the `NestedTypeNode` resolvers, `parseOptionalAccountStrategy`, the legacy `constantValueNodeFromString` / `constantPdaSeedNodeFromString` flavours, etc.) survive at the top of `packages/nodes/src/`. The package's `index.ts` re-exports the generated tree alongside them.

    Two intentional behaviour changes shake out of the rebuild:
    - **`docs` is now omitted entirely from the encoded shape when it would be empty.** Constructors that accept a `docs?: DocsInput` parameter previously emitted `docs: []` on the frozen node when the caller said nothing about docs; they now drop the `docs` key altogether. This matches the Rust side, keeps absent documentation out of serialised IDLs, and aligns with the `docs?: Docs` optional field already declared by `@codama/node-types`. `removeDocsVisitor` in `@codama/visitors-core` is updated to delete the `docs` key rather than blank it to `[]`, following the same convention.
    - **`rootNode().version` now reflects the spec version `@codama/nodes` was generated against, not the runtime package version.** The constructor previously read the `__VERSION__` build-time global injected from the package's `npm_package_version`; it now reads the generated `CODAMA_VERSION` constant. In practice the two have always tracked the same release cadence so the change is invisible at HEAD, but it makes the architectural intent explicit: the version pinned in the IDL is the spec version, not the package version. The `__VERSION__` build-time global and its `packages/nodes/src/types/global.d.ts` declaration are removed accordingly.

    The legacy plural-noun constants (`TYPE_NODES`, `VALUE_NODES`, `CONTEXTUAL_VALUE_NODES`, `INSTRUCTION_INPUT_VALUE_NODES`, `COUNT_NODES`, `DISCRIMINATOR_NODES`, `LINK_NODES`, `PDA_SEED_NODES`, `ENUM_VARIANT_TYPE_NODES`) are preserved as alias re-exports of the new canonical `*_NODE_KINDS` names.

    The generator drives almost entirely from the spec, with a minimal per-node configuration table carrying only the conveniences the spec can't express: which spec attributes appear as bare positional parameters (the rest land in a trailing `options` bag), and per-attribute overrides for defaulted values, string-coercion patterns on link targets, and the handful of bespoke body expressions (`instructionByteDeltaNode.withHeader`). The renderer derives signature shapes, generic parameters, return types, the `XxxNodeInput` declarations, the `Partial<>` wrapping decision, the `name: string` relaxation, the `docs?: DocsInput` / drop-if-empty handling, and the conditional-spread of optional attributes from the spec directly. An auto-import scan walks each rendered file and pulls in any spec or hand-written identifier the source references, so the configuration never declares imports. Generic-parameter lifting and ordering rely on the same `narrowableDataAttributes` + `genericParamOrder` tables the `nodeTypes` generator uses, keeping the constructor's generics in lockstep with the interface's.

- Updated dependencies [[`0b3a781`](https://github.com/codama-idl/codama/commit/0b3a781c024b27397e17ad456f039f76382cb519)]:
    - @codama/nodes@1.8.0
    - @codama/errors@1.8.0

## 1.7.0

### Minor Changes

- [#958](https://github.com/codama-idl/codama/pull/958) [`d4aa3bf`](https://github.com/codama-idl/codama/commit/d4aa3bfdd1ec7db95710aeed28ce62db84f11655) Thanks [@tanmay4l](https://github.com/tanmay4l)! - Add support for constants with new ConstantNode

### Patch Changes

- Updated dependencies [[`d4aa3bf`](https://github.com/codama-idl/codama/commit/d4aa3bfdd1ec7db95710aeed28ce62db84f11655)]:
    - @codama/nodes@1.7.0
    - @codama/errors@1.7.0

## 1.6.0

### Patch Changes

- [#985](https://github.com/codama-idl/codama/pull/985) [`6487af5`](https://github.com/codama-idl/codama/commit/6487af56598eee691a67c7e7966626ac6d0a2624) Thanks [@daog1](https://github.com/daog1)! - Add new `EventNode` to `ProgramNode` and update the Anchor adapter accordingly.

- Updated dependencies [[`2428220`](https://github.com/codama-idl/codama/commit/2428220162766b7f0547cea8d5f617a93b06732d), [`6487af5`](https://github.com/codama-idl/codama/commit/6487af56598eee691a67c7e7966626ac6d0a2624)]:
    - @codama/errors@1.6.0
    - @codama/nodes@1.6.0

## 1.5.1

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.5.1
    - @codama/nodes@1.5.1

## 1.5.0

### Minor Changes

- [#936](https://github.com/codama-idl/codama/pull/936) [`e537ed3`](https://github.com/codama-idl/codama/commit/e537ed3a08e0fc0c57251ac2109f8499ad8e3803) Thanks [@TanmayDhobale](https://github.com/TanmayDhobale)! - Add a new InstructionStatusNode to instructions

### Patch Changes

- Updated dependencies [[`e537ed3`](https://github.com/codama-idl/codama/commit/e537ed3a08e0fc0c57251ac2109f8499ad8e3803)]:
    - @codama/nodes@1.5.0
    - @codama/errors@1.5.0

## 1.4.4

### Patch Changes

- [#944](https://github.com/codama-idl/codama/pull/944) [`6ad73e4`](https://github.com/codama-idl/codama/commit/6ad73e44a8c866706483a0da3280479324903307) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Enable Rollup treeshaking pass by default, disable only for CLI builds

- Updated dependencies [[`6ad73e4`](https://github.com/codama-idl/codama/commit/6ad73e44a8c866706483a0da3280479324903307)]:
    - @codama/errors@1.4.4
    - @codama/nodes@1.4.4

## 1.4.3

### Patch Changes

- [#942](https://github.com/codama-idl/codama/pull/942) [`ef5d104`](https://github.com/codama-idl/codama/commit/ef5d104af0746d46a41a2733f1cd5600c538aad9) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove treeshake workaround for Rollup's deprecated assert syntax

- Updated dependencies [[`ef5d104`](https://github.com/codama-idl/codama/commit/ef5d104af0746d46a41a2733f1cd5600c538aad9)]:
    - @codama/errors@1.4.3
    - @codama/nodes@1.4.3

## 1.4.2

### Patch Changes

- Updated dependencies [[`5ec491f`](https://github.com/codama-idl/codama/commit/5ec491f446e37cbb98407dc16b608fd2a649be00)]:
    - @codama/errors@1.4.2
    - @codama/nodes@1.4.2

## 1.4.1

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.4.1
    - @codama/nodes@1.4.1

## 1.4.0

### Patch Changes

- Updated dependencies [[`5c3fb46`](https://github.com/codama-idl/codama/commit/5c3fb46cf5898ec9130d1f29bd7a876fcef19128)]:
    - @codama/nodes@1.4.0
    - @codama/errors@1.4.0

## 1.3.8

### Patch Changes

- Updated dependencies [[`07825de`](https://github.com/codama-idl/codama/commit/07825dec4cbd9d773f3197a46964dfb38d63d80e)]:
    - @codama/errors@1.3.8
    - @codama/nodes@1.3.8

## 1.3.7

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.7
    - @codama/nodes@1.3.7

## 1.3.6

### Patch Changes

- Updated dependencies [[`a62b4c5`](https://github.com/codama-idl/codama/commit/a62b4c5701b92642b8e4069953969f1f9c3dd20c)]:
    - @codama/errors@1.3.6
    - @codama/nodes@1.3.6

## 1.3.5

### Patch Changes

- [#839](https://github.com/codama-idl/codama/pull/839) [`8638fa7`](https://github.com/codama-idl/codama/commit/8638fa7b9b81ca4fb2ad895ec52221a1804649fe) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix small bugs on the `getByteSizeVisitor` helper

- [#840](https://github.com/codama-idl/codama/pull/840) [`0bb08e6`](https://github.com/codama-idl/codama/commit/0bb08e64855ec4671b263dd6c145bb8567eefb94) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `getMaxByteSizeVisitor` helper

- Updated dependencies []:
    - @codama/errors@1.3.5
    - @codama/nodes@1.3.5

## 1.3.4

### Patch Changes

- [#813](https://github.com/codama-idl/codama/pull/813) [`1f9f614`](https://github.com/codama-idl/codama/commit/1f9f614d3ed02439135a6037343f139e8a127c48) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix size computation of the `RemainderOptionTypeNode`. This node should always be of variable size unless the item it wraps is of size 0.

- Updated dependencies []:
    - @codama/errors@1.3.4
    - @codama/nodes@1.3.4

## 1.3.3

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.3
    - @codama/nodes@1.3.3

## 1.3.2

### Patch Changes

- [#746](https://github.com/codama-idl/codama/pull/746) [`b912ac8`](https://github.com/codama-idl/codama/commit/b912ac89b2d041c1f783da8d6f023fdf77dbd7e7) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Use NodePath<Node> instead of Node[] for node selector function

- Updated dependencies []:
    - @codama/errors@1.3.2
    - @codama/nodes@1.3.2

## 1.3.1

### Patch Changes

- [#731](https://github.com/codama-idl/codama/pull/731) [`71caa87`](https://github.com/codama-idl/codama/commit/71caa87d7010ecfeed5fb08e79955e5a7e8c0779) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix size computation of array-like nodes (arrays, sets and maps).

- Updated dependencies []:
    - @codama/errors@1.3.1
    - @codama/nodes@1.3.1

## 1.3.0

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.0
    - @codama/nodes@1.3.0

## 1.2.13

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.13
    - @codama/nodes@1.2.13

## 1.2.12

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.12
    - @codama/nodes@1.2.12

## 1.2.11

### Patch Changes

- [#512](https://github.com/codama-idl/codama/pull/512) [`5071455`](https://github.com/codama-idl/codama/commit/5071455b05359fc427c1d6295e7abb0e39503a15) Thanks [@stegaBOB](https://github.com/stegaBOB)! - Marked additional node type fields as optional

- Updated dependencies [[`5071455`](https://github.com/codama-idl/codama/commit/5071455b05359fc427c1d6295e7abb0e39503a15)]:
    - @codama/nodes@1.2.11
    - @codama/errors@1.2.11

## 1.2.10

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.10
    - @codama/nodes@1.2.10

## 1.2.9

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.9
    - @codama/nodes@1.2.9

## 1.2.8

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.8
    - @codama/nodes@1.2.8

## 1.2.7

### Patch Changes

- Updated dependencies [[`7e275ab`](https://github.com/codama-idl/codama/commit/7e275ab51c6d1b20b54ea9f4976b0692a308b2d2)]:
    - @codama/errors@1.2.7
    - @codama/nodes@1.2.7

## 1.2.6

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.6
    - @codama/nodes@1.2.6

## 1.2.5

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.5
    - @codama/nodes@1.2.5

## 1.2.4

### Patch Changes

- Updated dependencies [[`f0c2190`](https://github.com/codama-idl/codama/commit/f0c219076af58c098319f4ca9494a98e198d99a1)]:
    - @codama/errors@1.2.4
    - @codama/nodes@1.2.4

## 1.2.3

### Patch Changes

- Updated dependencies [[`4ceeb5e`](https://github.com/codama-idl/codama/commit/4ceeb5e6c479690fe878d25af6a5d48953adfa6a)]:
    - @codama/errors@1.2.3
    - @codama/nodes@1.2.3

## 1.2.2

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.2
    - @codama/nodes@1.2.2

## 1.2.1

### Patch Changes

- Updated dependencies [[`92efaa9`](https://github.com/codama-idl/codama/commit/92efaa9261f38de10a1b691c5b25ea0ecf95360b)]:
    - @codama/errors@1.2.1
    - @codama/nodes@1.2.1

## 1.2.0

### Patch Changes

- [#334](https://github.com/codama-idl/codama/pull/334) [`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump dependencies

- Updated dependencies [[`a3225b0`](https://github.com/codama-idl/codama/commit/a3225b0e68e59746f911865653bb1d05c3aec22b), [`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7)]:
    - @codama/nodes@1.2.0
    - @codama/errors@1.2.0

## 1.1.0

### Minor Changes

- [#280](https://github.com/codama-idl/codama/pull/280) [`c31eea8`](https://github.com/codama-idl/codama/commit/c31eea83c3f8659094324acc2b780054d72b7e90) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use `NodePaths` in `NodeSelectors`

- [#270](https://github.com/codama-idl/codama/pull/270) [`81dedc1`](https://github.com/codama-idl/codama/commit/81dedc195feab40bfc3aa676a633a8340ad56e24) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Record and resolve `NodePaths` instead of `Nodes` in `LinkableDictionary`

- [#266](https://github.com/codama-idl/codama/pull/266) [`4799a7f`](https://github.com/codama-idl/codama/commit/4799a7f291677304823aa206bed64baabc20eb5b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `LinkableDictionary`'s inner `NodeStack`

- [#282](https://github.com/codama-idl/codama/pull/282) [`1f52f00`](https://github.com/codama-idl/codama/commit/1f52f00ba2a75a783879abfbaf4397c3e04e4db4) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix LinkNode paths for `getByteSizeVisitor`

- [#285](https://github.com/codama-idl/codama/pull/285) [`ce4936c`](https://github.com/codama-idl/codama/commit/ce4936c031a2ba07f1bdb52cab8debcfec810d8c) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow passing `NodeStacks` to nested visitors

- [#269](https://github.com/codama-idl/codama/pull/269) [`e95783b`](https://github.com/codama-idl/codama/commit/e95783bf02fd12327ca5b6f1c1c4e50e189dd241) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Introduces the `NodePath` type

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.1.0
    - @codama/nodes@1.1.0

## 1.0.0

### Major Changes

- [#236](https://github.com/codama-idl/codama/pull/236) [`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Publish codama v1 packages

### Patch Changes

- Updated dependencies [[`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8)]:
    - @codama/errors@1.0.0
    - @codama/nodes@1.0.0

## 0.22.0

### Minor Changes

- [#183](https://github.com/codama-idl/codama/pull/183) [`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `InstructionLinkNode`, `InstructionAccountLinkNode` and `InstructionArgumentLinkNode`

- [#175](https://github.com/codama-idl/codama/pull/175) [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `importFrom` attributes from link nodes and resolvers

    Instead, a new `linkOverrides` attribute is introduced on all renderers to redirect a link node or a resolver to a custom path or module.

- [#180](https://github.com/codama-idl/codama/pull/180) [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add optional `program` attribute to link nodes and namespace linkable nodes under their associated program.

### Patch Changes

- Updated dependencies [[`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925), [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540), [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b)]:
    - @codama/errors@0.22.0
    - @codama/nodes@0.22.0

## 0.21.5

### Patch Changes

- Updated dependencies [[`a6849d3`](https://github.com/codama-idl/codama/commit/a6849d36a828e2b6b703f2a86d2ea0ae6d2fa0d8)]:
    - @codama/errors@0.21.5
    - @codama/nodes@0.21.5

## 0.21.4

### Patch Changes

- Updated dependencies []:
    - @codama/errors@0.21.4
    - @codama/nodes@0.21.4

## 0.21.3

### Patch Changes

- [#123](https://github.com/codama-idl/codama/pull/123) [`59ceb1d`](https://github.com/codama-idl/codama/commit/59ceb1d7803307b3a1a5e23ea3267934ad87bfc6) Thanks [@dependabot](https://github.com/apps/dependabot)! - Update prettier

- Updated dependencies []:
    - @codama/errors@0.21.3
    - @codama/nodes@0.21.3

## 0.21.2

### Patch Changes

- [#173](https://github.com/codama-idl/codama/pull/173) [`23e3dc2`](https://github.com/codama-idl/codama/commit/23e3dc2da6072fefc40e8205c19e44b646aa40a0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Record linkables before the first visit

- [#172](https://github.com/codama-idl/codama/pull/172) [`33de843`](https://github.com/codama-idl/codama/commit/33de84386af661dc870b248b5301dafe1df2aba2) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `interceptFirstVisitVisitor` helper

- Updated dependencies []:
    - @codama/errors@0.21.2
    - @codama/nodes@0.21.2

## 0.21.1

### Patch Changes

- [#168](https://github.com/codama-idl/codama/pull/168) [`2e8ce36`](https://github.com/codama-idl/codama/commit/2e8ce36af43a853673b0805c86a62672869de487) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `find` helper function to the `NodeStack` class

- Updated dependencies []:
    - @codama/errors@0.21.1
    - @codama/nodes@0.21.1

## 0.21.0

### Minor Changes

- [#111](https://github.com/codama-idl/codama/pull/111) [`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `RemainderOptionTypeNode`

    A node that represents an optional item using a child `TypeNode` such that the item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer.

### Patch Changes

- Updated dependencies [[`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f)]:
    - @codama/errors@0.21.0
    - @codama/nodes@0.21.0

## 0.20.6

### Patch Changes

- Updated dependencies [[`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f)]:
    - @codama/errors@0.20.6
    - @codama/nodes@0.20.6

## 0.20.5

### Patch Changes

- [#94](https://github.com/codama-idl/codama/pull/94) [`88572e8`](https://github.com/codama-idl/codama/commit/88572e8eaffe09b5b8c48c4e9aebfdeb8bc149e6) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix identityVisitor for inlined PdaValueNode

- Updated dependencies [[`908acba`](https://github.com/codama-idl/codama/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8)]:
    - @codama/errors@0.20.5
    - @codama/nodes@0.20.5

## 0.20.4

### Patch Changes

- Updated dependencies [[`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
    - @codama/nodes@0.20.4
    - @codama/errors@0.20.4

## 0.20.3

### Patch Changes

- [#39](https://github.com/codama-idl/codama/pull/39) [`d938e04`](https://github.com/codama-idl/codama/commit/d938e04b8cf5765c5bb2b68916b29e892fd5ad70) Thanks [@febo](https://github.com/febo)! - Add missing getOrThrow implementation

- Updated dependencies [[`4bc5823`](https://github.com/codama-idl/codama/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c)]:
    - @codama/errors@0.20.3
    - @codama/nodes@0.20.3

## 0.20.2

### Patch Changes

- [`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

- Updated dependencies [[`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e)]:
    - @codama/errors@0.20.2
    - @codama/nodes@0.20.2

## 0.20.1

### Patch Changes

- Updated dependencies [[`0dec0c8`](https://github.com/codama-idl/codama/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0)]:
    - @codama/errors@0.20.1
    - @codama/nodes@0.20.1
