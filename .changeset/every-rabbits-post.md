---
'@codama/visitors': major
---

Rename the visitors built around instruction arguments now that Codama v2 stores them as a struct in `instructionNode.data`, and remove the helpers that no longer apply.

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

**Histogram keys renamed.** `DefinedTypeHistogram` is keyed by identifiers (`IdentifierString`) rather than camelCase names, and its counters follow the new data model.

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
