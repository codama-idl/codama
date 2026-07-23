# @codama/nodes

## 1.10.0

### Minor Changes

- [#1025](https://github.com/codama-idl/codama/pull/1025) [`add9be2`](https://github.com/codama-idl/codama/commit/add9be28470d66ad2e99fab7688597ef7840cb4a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Omit empty array attributes from nodes, and default absent arrays to `[]` on read.

    Every node array attribute — whether previously required (e.g. `programNode.accounts`, `instructionNode.arguments`, `structTypeNode.fields`) or optional (e.g. `instructionNode.discriminators`) — is now omitted from the node when empty, and defaults to `[]` when absent. An absent array and an empty array are semantically identical, so this keeps encoded IDLs small (they are often uploaded on-chain) and makes adding or omitting an array attribute non-breaking. Reading remains backwards-compatible: IDLs that still serialise empty arrays continue to parse, and every visitor and accessor normalises an absent array to `[]`.

    **Breaking type change.** While runtime reads stay backwards-compatible, this is a breaking change at the type level for external consumers such as renderers and community packages. Array attributes are now typed as optional on the node interfaces (e.g. `ProgramNode.accounts` is now `readonly accounts?: AccountNode[]`), so any code that reads an array attribute without guarding — e.g. `program.accounts.map(…)` — must now coalesce with `?? []` (`(program.accounts ?? []).map(…)`). Type-parameter constraints also widen from `Array<T>` to `Array<T> | undefined`, so indexing into these types (e.g. `InstructionNode['arguments'][number]`) must be rewritten as `NonNullable<InstructionNode['arguments']>[number]`. Consumers should expect compile errors on the first unguarded array read after upgrading and add `?? []` guards accordingly.

- [#1023](https://github.com/codama-idl/codama/pull/1023) [`61ac0a6`](https://github.com/codama-idl/codama/commit/61ac0a6d426802d35d0fe0a1eb4fc92b33b0d8a9) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Integrate `@codama/spec@1.8.0`, adding the `pluginNode` to the node meta-model. A `pluginNode` attaches named, plugin-specific data to a node: it carries a `name` that uniquely identifies the plugin and an optional opaque `payload`. The payload is typed by the new `json` type expression, which renders as `unknown` in TypeScript. `instructionNode` gains an optional `plugins` field holding an array of `pluginNode`. All changes are additive and optional.

### Patch Changes

- Updated dependencies [[`add9be2`](https://github.com/codama-idl/codama/commit/add9be28470d66ad2e99fab7688597ef7840cb4a)]:
    - @codama/node-types@1.10.0
    - @codama/errors@1.10.0

## 1.9.0

### Minor Changes

- [#1020](https://github.com/codama-idl/codama/pull/1020) [`d3d9c1d`](https://github.com/codama-idl/codama/commit/d3d9c1dcab8be709b7047f7a259ad63f12cb160d) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Integrate `@codama/spec@1.7.0`, adding the presentation layer to the node meta-model. This introduces display nodes (`amountNumberDisplayNode`, `dateTimeNumberDisplayNode`, `durationNumberDisplayNode`, `stringDisplayNode`, `instructionDisplayNode`, `instructionAccountDisplayNode`, `structFieldDisplayNode`, `enumVariantDisplayNode`), the provide/inject graph (`providedNode`, `injectedValueNode`), the `accountFieldValueNode` contextual value backed by `instructionAccountNode.accountLink`, and the `anyNode` type expression. Existing nodes gain optional `display`/`provides` fields. All changes are additive and optional.

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.9.0
    - @codama/node-types@1.9.0

## 1.8.0

### Minor Changes

- [#997](https://github.com/codama-idl/codama/pull/997) [`0b3a781`](https://github.com/codama-idl/codama/commit/0b3a781c024b27397e17ad456f039f76382cb519) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Regenerate the `xxxNodeInput` types and `xxxNode()` constructors of `@codama/nodes` from the encoded `@codama/spec` description, via a new `nodes` generator inside `@codama-internal/spec-generators`. The runtime `*_NODE_KINDS` arrays (`STANDALONE_TYPE_NODE_KINDS`, `REGISTERED_VALUE_NODE_KINDS`, `INSTRUCTION_INPUT_VALUE_NODE_KINDS`, …, and the top-level `REGISTERED_NODE_KINDS`) are now generated from the spec's union definitions instead of being maintained by hand. A new top-level `CODAMA_VERSION` constant, typed as `CodamaVersion` and pinned to the spec version at generation time, is the single source of truth for the version `@codama/nodes` was built against — `rootNode()` reads it directly when tagging the document.

    The bulk of the surface lives under `packages/nodes/src/generated/` and is produced on every `pnpm generate` run. The previously hand-maintained constructors and kinds-arrays are gone; only hand-written helpers (`isNode`, `assertIsNode`, `getAllPrograms`, `getAllInstructions`, `getAllInstructionsWithSubs`, `isScalarEnum`, `isDataEnum`, `isSignedInteger`, the `NestedTypeNode` resolvers, `parseOptionalAccountStrategy`, the legacy `constantValueNodeFromString` / `constantPdaSeedNodeFromString` flavours, etc.) survive at the top of `packages/nodes/src/`. The package's `index.ts` re-exports the generated tree alongside them.

    Two intentional behaviour changes shake out of the rebuild:
    - **`docs` is now omitted entirely from the encoded shape when it would be empty.** Constructors that accept a `docs?: DocsInput` parameter previously emitted `docs: []` on the frozen node when the caller said nothing about docs; they now drop the `docs` key altogether. This matches the Rust side, keeps absent documentation out of serialised IDLs, and aligns with the `docs?: Docs` optional field already declared by `@codama/node-types`. `removeDocsVisitor` in `@codama/visitors-core` is updated to delete the `docs` key rather than blank it to `[]`, following the same convention.
    - **`rootNode().version` now reflects the spec version `@codama/nodes` was generated against, not the runtime package version.** The constructor previously read the `__VERSION__` build-time global injected from the package's `npm_package_version`; it now reads the generated `CODAMA_VERSION` constant. In practice the two have always tracked the same release cadence so the change is invisible at HEAD, but it makes the architectural intent explicit: the version pinned in the IDL is the spec version, not the package version. The `__VERSION__` build-time global and its `packages/nodes/src/types/global.d.ts` declaration are removed accordingly.

    The legacy plural-noun constants (`TYPE_NODES`, `VALUE_NODES`, `CONTEXTUAL_VALUE_NODES`, `INSTRUCTION_INPUT_VALUE_NODES`, `COUNT_NODES`, `DISCRIMINATOR_NODES`, `LINK_NODES`, `PDA_SEED_NODES`, `ENUM_VARIANT_TYPE_NODES`) are preserved as alias re-exports of the new canonical `*_NODE_KINDS` names.

    The generator drives almost entirely from the spec, with a minimal per-node configuration table carrying only the conveniences the spec can't express: which spec attributes appear as bare positional parameters (the rest land in a trailing `options` bag), and per-attribute overrides for defaulted values, string-coercion patterns on link targets, and the handful of bespoke body expressions (`instructionByteDeltaNode.withHeader`). The renderer derives signature shapes, generic parameters, return types, the `XxxNodeInput` declarations, the `Partial<>` wrapping decision, the `name: string` relaxation, the `docs?: DocsInput` / drop-if-empty handling, and the conditional-spread of optional attributes from the spec directly. An auto-import scan walks each rendered file and pulls in any spec or hand-written identifier the source references, so the configuration never declares imports. Generic-parameter lifting and ordering rely on the same `narrowableDataAttributes` + `genericParamOrder` tables the `nodeTypes` generator uses, keeping the constructor's generics in lockstep with the interface's.

### Patch Changes

- Updated dependencies [[`2f7c443`](https://github.com/codama-idl/codama/commit/2f7c44377520fdb512de7d25b74a03ffd8c1a491), [`8667174`](https://github.com/codama-idl/codama/commit/8667174aabec62aed0a6a11822a87e66c9720246)]:
    - @codama/node-types@1.8.0
    - @codama/errors@1.8.0

## 1.7.0

### Minor Changes

- [#958](https://github.com/codama-idl/codama/pull/958) [`d4aa3bf`](https://github.com/codama-idl/codama/commit/d4aa3bfdd1ec7db95710aeed28ce62db84f11655) Thanks [@tanmay4l](https://github.com/tanmay4l)! - Add support for constants with new ConstantNode

### Patch Changes

- Updated dependencies [[`d4aa3bf`](https://github.com/codama-idl/codama/commit/d4aa3bfdd1ec7db95710aeed28ce62db84f11655)]:
    - @codama/node-types@1.7.0
    - @codama/errors@1.7.0

## 1.6.0

### Minor Changes

- [#985](https://github.com/codama-idl/codama/pull/985) [`6487af5`](https://github.com/codama-idl/codama/commit/6487af56598eee691a67c7e7966626ac6d0a2624) Thanks [@daog1](https://github.com/daog1)! - Add new `EventNode` to `ProgramNode` and update the Anchor adapter accordingly.

### Patch Changes

- Updated dependencies [[`2428220`](https://github.com/codama-idl/codama/commit/2428220162766b7f0547cea8d5f617a93b06732d), [`6487af5`](https://github.com/codama-idl/codama/commit/6487af56598eee691a67c7e7966626ac6d0a2624)]:
    - @codama/errors@1.6.0
    - @codama/node-types@1.6.0

## 1.5.1

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.5.1
    - @codama/node-types@1.5.1

## 1.5.0

### Minor Changes

- [#936](https://github.com/codama-idl/codama/pull/936) [`e537ed3`](https://github.com/codama-idl/codama/commit/e537ed3a08e0fc0c57251ac2109f8499ad8e3803) Thanks [@TanmayDhobale](https://github.com/TanmayDhobale)! - Add a new InstructionStatusNode to instructions

### Patch Changes

- Updated dependencies [[`e537ed3`](https://github.com/codama-idl/codama/commit/e537ed3a08e0fc0c57251ac2109f8499ad8e3803)]:
    - @codama/node-types@1.5.0
    - @codama/errors@1.5.0

## 1.4.4

### Patch Changes

- [#944](https://github.com/codama-idl/codama/pull/944) [`6ad73e4`](https://github.com/codama-idl/codama/commit/6ad73e44a8c866706483a0da3280479324903307) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Enable Rollup treeshaking pass by default, disable only for CLI builds

- Updated dependencies [[`6ad73e4`](https://github.com/codama-idl/codama/commit/6ad73e44a8c866706483a0da3280479324903307)]:
    - @codama/errors@1.4.4
    - @codama/node-types@1.4.4

## 1.4.3

### Patch Changes

- [#942](https://github.com/codama-idl/codama/pull/942) [`ef5d104`](https://github.com/codama-idl/codama/commit/ef5d104af0746d46a41a2733f1cd5600c538aad9) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove treeshake workaround for Rollup's deprecated assert syntax

- Updated dependencies [[`ef5d104`](https://github.com/codama-idl/codama/commit/ef5d104af0746d46a41a2733f1cd5600c538aad9)]:
    - @codama/errors@1.4.3
    - @codama/node-types@1.4.3

## 1.4.2

### Patch Changes

- Updated dependencies [[`5ec491f`](https://github.com/codama-idl/codama/commit/5ec491f446e37cbb98407dc16b608fd2a649be00)]:
    - @codama/errors@1.4.2
    - @codama/node-types@1.4.2

## 1.4.1

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.4.1
    - @codama/node-types@1.4.1

## 1.4.0

### Minor Changes

- [#915](https://github.com/codama-idl/codama/pull/915) [`5c3fb46`](https://github.com/codama-idl/codama/commit/5c3fb46cf5898ec9130d1f29bd7a876fcef19128) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add optional programId field to PdaValueNode to allow using a provided account as the program of the PDA

### Patch Changes

- Updated dependencies [[`5c3fb46`](https://github.com/codama-idl/codama/commit/5c3fb46cf5898ec9130d1f29bd7a876fcef19128)]:
    - @codama/node-types@1.4.0
    - @codama/errors@1.4.0

## 1.3.8

### Patch Changes

- Updated dependencies [[`07825de`](https://github.com/codama-idl/codama/commit/07825dec4cbd9d773f3197a46964dfb38d63d80e)]:
    - @codama/errors@1.3.8
    - @codama/node-types@1.3.8

## 1.3.7

### Patch Changes

- Updated dependencies [[`55122fd`](https://github.com/codama-idl/codama/commit/55122fda70f5a832fd791cda17172e41cbe55c1b)]:
    - @codama/node-types@1.3.7
    - @codama/errors@1.3.7

## 1.3.6

### Patch Changes

- Updated dependencies [[`a62b4c5`](https://github.com/codama-idl/codama/commit/a62b4c5701b92642b8e4069953969f1f9c3dd20c)]:
    - @codama/errors@1.3.6
    - @codama/node-types@1.3.6

## 1.3.5

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.5
    - @codama/node-types@1.3.5

## 1.3.4

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.4
    - @codama/node-types@1.3.4

## 1.3.3

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.3
    - @codama/node-types@1.3.3

## 1.3.2

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.2
    - @codama/node-types@1.3.2

## 1.3.1

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.1
    - @codama/node-types@1.3.1

## 1.3.0

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.0
    - @codama/node-types@1.3.0

## 1.2.13

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.13
    - @codama/node-types@1.2.13

## 1.2.12

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.12
    - @codama/node-types@1.2.12

## 1.2.11

### Patch Changes

- [#512](https://github.com/codama-idl/codama/pull/512) [`5071455`](https://github.com/codama-idl/codama/commit/5071455b05359fc427c1d6295e7abb0e39503a15) Thanks [@stegaBOB](https://github.com/stegaBOB)! - Marked additional node type fields as optional

- Updated dependencies [[`5071455`](https://github.com/codama-idl/codama/commit/5071455b05359fc427c1d6295e7abb0e39503a15)]:
    - @codama/node-types@1.2.11
    - @codama/errors@1.2.11

## 1.2.10

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.10
    - @codama/node-types@1.2.10

## 1.2.9

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.9
    - @codama/node-types@1.2.9

## 1.2.8

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.8
    - @codama/node-types@1.2.8

## 1.2.7

### Patch Changes

- Updated dependencies [[`7e275ab`](https://github.com/codama-idl/codama/commit/7e275ab51c6d1b20b54ea9f4976b0692a308b2d2)]:
    - @codama/errors@1.2.7
    - @codama/node-types@1.2.7

## 1.2.6

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.6
    - @codama/node-types@1.2.6

## 1.2.5

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.5
    - @codama/node-types@1.2.5

## 1.2.4

### Patch Changes

- Updated dependencies [[`f0c2190`](https://github.com/codama-idl/codama/commit/f0c219076af58c098319f4ca9494a98e198d99a1)]:
    - @codama/errors@1.2.4
    - @codama/node-types@1.2.4

## 1.2.3

### Patch Changes

- Updated dependencies [[`4ceeb5e`](https://github.com/codama-idl/codama/commit/4ceeb5e6c479690fe878d25af6a5d48953adfa6a)]:
    - @codama/errors@1.2.3
    - @codama/node-types@1.2.3

## 1.2.2

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.2
    - @codama/node-types@1.2.2

## 1.2.1

### Patch Changes

- Updated dependencies [[`92efaa9`](https://github.com/codama-idl/codama/commit/92efaa9261f38de10a1b691c5b25ea0ecf95360b)]:
    - @codama/errors@1.2.1
    - @codama/node-types@1.2.1

## 1.2.0

### Minor Changes

- [#367](https://github.com/codama-idl/codama/pull/367) [`a3225b0`](https://github.com/codama-idl/codama/commit/a3225b0e68e59746f911865653bb1d05c3aec22b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Absorb all special characters when converting string cases

### Patch Changes

- Updated dependencies [[`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7)]:
    - @codama/errors@1.2.0
    - @codama/node-types@1.2.0

## 1.1.0

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.1.0
    - @codama/node-types@1.1.0

## 1.0.0

### Major Changes

- [#236](https://github.com/codama-idl/codama/pull/236) [`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Publish codama v1 packages

### Patch Changes

- Updated dependencies [[`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8)]:
    - @codama/errors@1.0.0
    - @codama/node-types@1.0.0

## 0.22.0

### Minor Changes

- [#183](https://github.com/codama-idl/codama/pull/183) [`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `InstructionLinkNode`, `InstructionAccountLinkNode` and `InstructionArgumentLinkNode`

- [#175](https://github.com/codama-idl/codama/pull/175) [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `importFrom` attributes from link nodes and resolvers

    Instead, a new `linkOverrides` attribute is introduced on all renderers to redirect a link node or a resolver to a custom path or module.

- [#180](https://github.com/codama-idl/codama/pull/180) [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add optional `program` attribute to link nodes and namespace linkable nodes under their associated program.

### Patch Changes

- Updated dependencies [[`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925), [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540), [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b)]:
    - @codama/node-types@0.22.0
    - @codama/errors@0.22.0

## 0.21.5

### Patch Changes

- Updated dependencies [[`a6849d3`](https://github.com/codama-idl/codama/commit/a6849d36a828e2b6b703f2a86d2ea0ae6d2fa0d8)]:
    - @codama/errors@0.21.5
    - @codama/node-types@0.21.5

## 0.21.4

### Patch Changes

- Updated dependencies []:
    - @codama/errors@0.21.4
    - @codama/node-types@0.21.4

## 0.21.3

### Patch Changes

- Updated dependencies []:
    - @codama/errors@0.21.3
    - @codama/node-types@0.21.3

## 0.21.2

### Patch Changes

- Updated dependencies []:
    - @codama/errors@0.21.2
    - @codama/node-types@0.21.2

## 0.21.1

### Patch Changes

- Updated dependencies []:
    - @codama/errors@0.21.1
    - @codama/node-types@0.21.1

## 0.21.0

### Minor Changes

- [#111](https://github.com/codama-idl/codama/pull/111) [`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `RemainderOptionTypeNode`

    A node that represents an optional item using a child `TypeNode` such that the item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer.

### Patch Changes

- Updated dependencies [[`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f)]:
    - @codama/node-types@0.21.0
    - @codama/errors@0.21.0

## 0.20.6

### Patch Changes

- [#102](https://github.com/codama-idl/codama/pull/102) [`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace \_\_DEV\_\_ with NODE_ENV is not production in codama

- Updated dependencies [[`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f)]:
    - @codama/errors@0.20.6
    - @codama/node-types@0.20.6

## 0.20.5

### Patch Changes

- [#42](https://github.com/codama-idl/codama/pull/42) [`908acba`](https://github.com/codama-idl/codama/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8) Thanks [@kespinola](https://github.com/kespinola)! - set anchor account seed definitions on instructions as defaultValue for the associated instruction account. Removes hoisting PDAs to the program node for the time being.

- Updated dependencies [[`908acba`](https://github.com/codama-idl/codama/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8)]:
    - @codama/errors@0.20.5
    - @codama/node-types@0.20.5

## 0.20.4

### Patch Changes

- [#43](https://github.com/codama-idl/codama/pull/43) [`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow PdaValueNode to inline their own PdaNode definition

- Updated dependencies [[`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
    - @codama/node-types@0.20.4
    - @codama/errors@0.20.4

## 0.20.3

### Patch Changes

- Updated dependencies [[`4bc5823`](https://github.com/codama-idl/codama/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c)]:
    - @codama/errors@0.20.3
    - @codama/node-types@0.20.3

## 0.20.2

### Patch Changes

- [`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

- Updated dependencies [[`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e)]:
    - @codama/errors@0.20.2
    - @codama/node-types@0.20.2

## 0.20.1

### Patch Changes

- [#21](https://github.com/codama-idl/codama/pull/21) [`0dec0c8`](https://github.com/codama-idl/codama/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix ESM and CJS exports on renderers

- Updated dependencies [[`0dec0c8`](https://github.com/codama-idl/codama/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0)]:
    - @codama/errors@0.20.1
    - @codama/node-types@0.20.1
