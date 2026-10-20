---
'@codama/visitors-core': major
---

Add `resolveTypePath` to follow path expressions such as `config.fees[0]` through types, and `isValueNodeOfType` to check a value node against a type. `NodePath` no longer distributes over node unions, `nodePathToString` renders paths like error messages do, and node selectors match identifiers exactly.

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
