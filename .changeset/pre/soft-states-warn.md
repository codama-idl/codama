---
'@codama/dynamic-instructions': major
---

Build instructions from their path within a Codama v2 IDL, using the program defining the instruction, which may be an additional program. Builders now validate data with the strict codecs of `@codama/dynamic-codecs`, read account data through an injected `fetchAccounts` option and accept a `linkables` option to avoid recording the linkable nodes of the IDL on each call.

**BREAKING CHANGES**

**`createInstructionsBuilder` takes a path and an input object.** It now takes the `NodePath<InstructionNode>` of the instruction and optional `{ fetchAccounts, linkables }` options, and the returned function takes a single `{ accounts, data, signers }` input instead of positional arguments. `fetchAccounts` is required when the new fourth generic `TReadsAccountData` is `true`.

```diff
- const build = createInstructionsBuilder(root, ixNode);
- const instruction = await build(args, accounts, signers, resolvers);
+ const build = createInstructionsBuilder([root, root.program, ixNode], { fetchAccounts });
+ const instruction = await build({ accounts, data, signers });
```

**Data encoding.** `encodeInstructionArguments(root, ixNode, args)` is replaced by `encodeInstructionData(path, data, options?)` and `createInstructionDataEncoder(path, linkables?)`. Codama errors are thrown as is and other encoding errors are wrapped in `FAILED_TO_ENCODE_DATA`. The superstruct validator is removed: values of the wrong type throw from the codecs and provided omitted fields are ignored rather than rejected.

**Account metas.** `createAccountMeta(root, ixNode, args, accounts, signers, resolvers)` is replaced by `createAccountMetas({ path, accounts, data, fetchAccounts, linkables, signers })`. Remaining accounts are provided as `Address[]` under their identifier in `accounts`, and unknown account keys are ignored.

**Resolvers removed.** Builders no longer accept resolvers, and the `ArgumentsInput`, `ResolverFn`, `ResolverFnInput` and `ResolversInput` re-exports are replaced by `DataInput`, `FetchAccountsFn` and `getBatchedFetchAccounts`. `InstructionsBuilderFn<TData, TAccounts, TSigners>` loses its `TResolvers` generic, and new `InstructionInput`, `CreateInstructionsBuilderOptions`, `CreateAccountMetasInput` and `EncodeInstructionDataOptions` types are exported.

**Codegen output.** Generated types use `${Name}InstructionDataArgs` instead of `${Name}Args`, no longer emit `${Name}Resolvers`, and add a `${Name}ReadsAccountData` flag per instruction. `${Program}InstructionBuilders` entries become `InstructionsBuilderFn<${Name}InstructionDataArgs, ${Name}Accounts, ${Name}Signers>`, using `undefined` for instructions without data.

**Dependencies.** `superstruct` is no longer a dependency.
