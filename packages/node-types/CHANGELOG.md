# @codama/node-types

## 1.8.1

## 1.8.0

### Minor Changes

- [#995](https://github.com/codama-idl/codama/pull/995) [`2f7c443`](https://github.com/codama-idl/codama/commit/2f7c44377520fdb512de7d25b74a03ffd8c1a491) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Regenerate the entire `@codama/node-types` source surface from the encoded `@codama/spec` description, via the new private `@codama-internal/spec-generators` package.

    The bulk of the surface lives under `src/generated/` and is produced by the `gen-ts-node-types` generator from the spec. The previously hand-maintained interfaces are gone; every node, union, enumeration, and per-spec shared type is rebuilt from the spec on every `pnpm generate` run.

    A small set of static helpers — the brand types, the `Docs` alias, and the `Version` template-literal type — live as hand-written sibling files at the top of `packages/node-types/src/`, alongside the existing `ProgramVersion` deprecated alias. They are imported by the generated surface but never regenerated, since their content doesn't depend on the spec. The generator wipes only `src/generated/` on every run; hand-written content at the top level survives. The per-spec `CodamaVersion` literal stays generated, in its own `src/generated/shared/codamaVersion.ts` file pinned to the spec version at generation time.

    Most of the rebuild is structural: imports now point at per-file paths (`./linkNodes/PdaLinkNode`) instead of subdirectory barrels, every interface and field carries a JSDoc block sourced from the spec, and array fields are emitted as `Array<T>` rather than `T[]` so an inline-union element type doesn't need extra parentheses to preserve precedence. A handful of named API differences also shake out from this:
    - `accountNode.size` is now typed as `number | undefined` (the previous `| null` arm had no consumer and is dropped).
    - `programNode.origin` is now typed as the named `ProgramOrigin` union (`'anchor' | 'shank'`) instead of an inline literal union.
    - `instructionAccountNode.isSigner` and `instructionRemainingAccountsNode.isSigner` now read `boolean | 'either'` instead of `true | false | 'either'` (a TypeScript-only readability normalisation; the encoded spec keeps the explicit `true | false` form so other codegen targets can still emit a multi-variant enum).
    - `numberTypeNode.format` and `stringTypeNode.encoding` are emitted as named `NumberFormat` / `BytesEncoding` aliases imported from `./shared/`, with the same generic-narrowing behaviour preserved.
    - `programNode.version` is now typed as the unified `Version` template-literal alias (`` `${number}.${number}.${number}` ``) — a tighter shape than the previous plain string, so non-conforming literal strings will now surface as TypeScript errors at the call site. The historical `ProgramVersion` name is preserved as a hand-written `@deprecated` re-export so existing consumers continue to compile; `@codama/nodes-from-anchor` is updated to import `Version` directly.
    - `docs?` fields use a `Docs = Array<string>` alias mirroring the `'docs'` `TypeExpr` kind in `@codama/spec`. The alias is hand-written and lives at `packages/node-types/src/Docs.ts`.
    - Documentation strings that ship as multiple paragraphs in the spec now render as multi-paragraph JSDoc blocks. Affected fields and types include `accountNode.discriminators`, `instructionNode.discriminators`, `instructionAccountNode.isSigner`, `instructionRemainingAccountsNode.isSigner`, `rootNode`, the `ConditionalValueNode` interface and its `condition`, `InstructionInputValueNode`, `ResolverValueNode`, `AmountTypeNode` and its `unit`, `MapTypeNode.size`, `NestedTypeNode`, `StringTypeNode.size`, `EnumValueNode.value`, and `NumberValueNode.number`.

    Alongside the per-node interfaces, the package now exports seven `Registered<Category>Node` category-registry unions (`RegisteredContextualValueNode`, `RegisteredCountNode`, `RegisteredDiscriminatorNode`, `RegisteredLinkNode`, `RegisteredPdaSeedNode`, `RegisteredTypeNode`, `RegisteredValueNode`) corresponding one-to-one with `@codama/spec`'s category registries, plus a `GetNodeFromKind<TKind extends NodeKind>` helper that resolves to the concrete interface for a given kind. The registry unions are the recommended extension point for downstream packages that need to introduce custom node kinds.

    The generator consumes `@codama/spec@1.6.0-rc.4`, which reshapes the spec into per-category groups (`spec.categories[]`) and renames the `nestedTypeNode` `TypeExpr` kind to `nestedUnion` (with an explicit `alias` field). All `docs?` fields throughout the spec are arrays of paragraph strings rather than single newline-separated strings — the renderer accepts the array shape directly. Internally, the generator's renderers are layout-agnostic: they emit `use(...)` calls keyed by symbolic module strings (e.g. `'node:numberTypeNode'`, `'enumeration:Endianness'`, `'brand:CamelCaseString'`), and a single per-spec `RenderScope` resolves those symbolic keys to concrete file locations at write time. Adding a new file kind to the generator means extending the `RenderScope` symbol map; renderers themselves stay free of file-layout knowledge.

### Patch Changes

- [#1001](https://github.com/codama-idl/codama/pull/1001) [`8667174`](https://github.com/codama-idl/codama/commit/8667174aabec62aed0a6a11822a87e66c9720246) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump `@codama/spec` from `1.6.0-rc.4` to `1.6.0-rc.6`. The encoded surface in `@codama/node-types` is functionally unchanged; one docstring paragraph on `NestedTypeNode` now reads `nestedTypeNode<T>` instead of `NestedTypeNode<T>` to mirror the spec's new camelCase nested-union alias name.

    Behind the scenes, `@codama-internal/spec-generators` learns about the new `{ kind: 'address' }` `TypeExpr` (rendered as plain `string` on the v1 TS surface — a dedicated `Address` brand may follow in a future spec major), the camelCase rename of every union and enumeration name on the spec side (the generated PascalCase TS identifiers are unaffected since the generator runs each name through `pascalCase()` at render time), and a constructor-signature bug where an attribute that was both `optional` and supplied with a default would emit invalid TS (`param?: T = default`). The bug never triggered against the rc.4 v1 spec but would have surfaced once any future attribute combined `optional: true` with a configured default; the fix is to omit the `?` mark whenever an initializer is present.

## 1.7.0

### Minor Changes

- [#958](https://github.com/codama-idl/codama/pull/958) [`d4aa3bf`](https://github.com/codama-idl/codama/commit/d4aa3bfdd1ec7db95710aeed28ce62db84f11655) Thanks [@tanmay4l](https://github.com/tanmay4l)! - Add support for constants with new ConstantNode

## 1.6.0

### Minor Changes

- [#985](https://github.com/codama-idl/codama/pull/985) [`6487af5`](https://github.com/codama-idl/codama/commit/6487af56598eee691a67c7e7966626ac6d0a2624) Thanks [@daog1](https://github.com/daog1)! - Add new `EventNode` to `ProgramNode` and update the Anchor adapter accordingly.

## 1.5.1

## 1.5.0

### Minor Changes

- [#936](https://github.com/codama-idl/codama/pull/936) [`e537ed3`](https://github.com/codama-idl/codama/commit/e537ed3a08e0fc0c57251ac2109f8499ad8e3803) Thanks [@TanmayDhobale](https://github.com/TanmayDhobale)! - Add a new InstructionStatusNode to instructions

## 1.4.4

### Patch Changes

- [#944](https://github.com/codama-idl/codama/pull/944) [`6ad73e4`](https://github.com/codama-idl/codama/commit/6ad73e44a8c866706483a0da3280479324903307) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Enable Rollup treeshaking pass by default, disable only for CLI builds

## 1.4.3

### Patch Changes

- [#942](https://github.com/codama-idl/codama/pull/942) [`ef5d104`](https://github.com/codama-idl/codama/commit/ef5d104af0746d46a41a2733f1cd5600c538aad9) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove treeshake workaround for Rollup's deprecated assert syntax

## 1.4.2

## 1.4.1

## 1.4.0

### Minor Changes

- [#915](https://github.com/codama-idl/codama/pull/915) [`5c3fb46`](https://github.com/codama-idl/codama/commit/5c3fb46cf5898ec9130d1f29bd7a876fcef19128) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add optional programId field to PdaValueNode to allow using a provided account as the program of the PDA

## 1.3.8

## 1.3.7

### Patch Changes

- [#853](https://github.com/codama-idl/codama/pull/853) [`55122fd`](https://github.com/codama-idl/codama/commit/55122fda70f5a832fd791cda17172e41cbe55c1b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Branded types now use exact values instead of TypeScript's more restictive `unique symbol`. This will allow multiple versions of the library to coexist.

## 1.3.6

## 1.3.5

## 1.3.4

## 1.3.3

## 1.3.2

## 1.3.1

## 1.3.0

## 1.2.13

## 1.2.12

## 1.2.11

### Patch Changes

- [#512](https://github.com/codama-idl/codama/pull/512) [`5071455`](https://github.com/codama-idl/codama/commit/5071455b05359fc427c1d6295e7abb0e39503a15) Thanks [@stegaBOB](https://github.com/stegaBOB)! - Marked additional node type fields as optional

## 1.2.10

## 1.2.9

## 1.2.8

## 1.2.7

## 1.2.6

## 1.2.5

## 1.2.4

## 1.2.3

## 1.2.2

## 1.2.1

## 1.2.0

## 1.1.0

## 1.0.0

### Major Changes

- [#236](https://github.com/codama-idl/codama/pull/236) [`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Publish codama v1 packages

## 0.22.0

### Minor Changes

- [#183](https://github.com/codama-idl/codama/pull/183) [`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `InstructionLinkNode`, `InstructionAccountLinkNode` and `InstructionArgumentLinkNode`

- [#175](https://github.com/codama-idl/codama/pull/175) [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `importFrom` attributes from link nodes and resolvers

    Instead, a new `linkOverrides` attribute is introduced on all renderers to redirect a link node or a resolver to a custom path or module.

- [#180](https://github.com/codama-idl/codama/pull/180) [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add optional `program` attribute to link nodes and namespace linkable nodes under their associated program.

## 0.21.5

## 0.21.4

## 0.21.3

## 0.21.2

## 0.21.1

## 0.21.0

### Minor Changes

- [#111](https://github.com/codama-idl/codama/pull/111) [`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `RemainderOptionTypeNode`

    A node that represents an optional item using a child `TypeNode` such that the item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer.

## 0.20.6

## 0.20.5

## 0.20.4

### Patch Changes

- [#43](https://github.com/codama-idl/codama/pull/43) [`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow PdaValueNode to inline their own PdaNode definition

## 0.20.3

## 0.20.2

### Patch Changes

- [`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

## 0.20.1
