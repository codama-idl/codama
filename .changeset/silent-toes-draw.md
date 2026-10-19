---
'@codama/visitors': major
---

Adapt `setNumberWrappersVisitor`, `setInstructionDiscriminatorsVisitor`, `setInstructionAccountDefaultValuesVisitor` and `fillDefaultPdaSeedValuesVisitor` to the Codama v2 numeric system and instruction data.

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
