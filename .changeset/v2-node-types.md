---
'@codama/node-types': major
'@codama/nodes': major
'@codama/visitors-core': major
---

Regenerate the node types, constructors and core visitors from the Codama v2 spec (`@codama/spec@2`).

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
