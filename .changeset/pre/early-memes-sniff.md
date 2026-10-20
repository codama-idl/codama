---
'@codama/nodes-from-anchor': major
---

Convert Anchor IDLs into Codama v2 IDLs. Alongside the new node model, the conversion now captures more of the Anchor IDL:

- Instruction account `relations` become `anchor.relations` plugins listing the accounts that must hold the account's address in their data. Legacy (v00) relations are flipped to follow the direction of current (v01) IDLs.
- PDA seeds can point to nested instruction arguments, following links to defined types, e.g. a `params.seed` seed becomes a `params_seed` seed whose value is `dataValueNode('params.seed')`. Only the PDAs of nested account seeds, e.g. `mint.authority`, are still skipped, since they require fetching the account.
- Legacy (v00) instruction accounts get PDA default values from their `pda` attribute.
- Instruction `returns` become the instruction's `returnData`.
- Type aliases (`kind: 'type'`) of current (v01) IDLs resolve to their aliased type.
- Programs, accounts and events carry their docs.

**BREAKING CHANGES**

**Identifiers keep the IDL's casing.** Names are no longer camelCased, so the identifiers of programs, accounts, instructions, arguments, types, events, errors and PDAs match the Anchor IDL, e.g. `transfer_tokens` in current (v01) IDLs. Discriminators are still derived from the names Anchor hashes.

**Instruction arguments become instruction data.** Instructions store their discriminator and arguments as the fields of a `data` struct, and PDA seeds refer to them through `dataValueNode`s. The `instructionArgumentNodeFromAnchorV00` and `instructionArgumentNodeFromAnchorV01` helpers are removed: use `structFieldTypeNodeFromAnchorV00` and `structFieldTypeNodeFromAnchorV01` instead. The instruction account helpers take these data fields and an options bag instead of a positional prefix, and `pdaSeedNodeFromAnchorV01` returns `undefined` for seeds that cannot be expressed statically.

```diff
- instructionAccountNodesFromAnchorV00(accounts, prefix);
+ instructionAccountNodesFromAnchorV00(accounts, dataFields, { definedTypes, prefix });
- instructionAccountNodesFromAnchorV01(accounts, instructionArguments, prefix);
+ instructionAccountNodesFromAnchorV01(accounts, dataFields, { definedTypes, prefix });
- pdaSeedNodeFromAnchorV01(seed, instructionArguments, prefix);
+ pdaSeedNodeFromAnchorV01(seed, dataFields, { definedTypes, prefix });
```

The same applies to `instructionAccountNodeFromAnchorV00` and `instructionAccountNodeFromAnchorV01`.

**Enum variant helpers unified.** The `enumEmptyVariantTypeNodeFromAnchorV0x`, `enumStructVariantTypeNodeFromAnchorV0x` and `enumTupleVariantTypeNodeFromAnchorV0x` helpers are replaced by `enumVariantTypeNodeFromAnchorV00` and `enumVariantTypeNodeFromAnchorV01`, which return an `enumVariantTypeNode` with a struct, tuple or no `data`.

**Lossless numbers.** Numbers become `integerTypeNode`s or `floatTypeNode`s, and integer constants become string-encoded `integerValueNode`s, so 64- and 128-bit constants are no longer rounded.

**No program origin.** Programs no longer carry an `origin`, which v2 removes.
