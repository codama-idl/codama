---
'@codama/dynamic-client': major
---

Port the dynamic client to Codama v2 IDLs. Methods now take the instruction `data`, remaining accounts are provided in `.accounts()`, default values may read account data through a `fetchAccounts` option and `client.pdas.x(seeds, { programId })` derives PDAs from another program. Each client records the linkable nodes of its IDL once and creates one builder per instruction on first use.

**BREAKING CHANGES**

**Latest major only.** `createProgramClient` and the codegen only accept IDLs of the latest major and throw `VERSION_MISMATCH` for older ones. Run `upgrade` from `@codama/upgrade` first, which is not done automatically so the two packages stay decoupled.

```diff
- const client = createProgramClient(v1Idl);
+ const client = createProgramClient(upgrade(v1Idl));
```

**`.resolvers()` removed.** Inputs carrying a `codama.resolver` plugin, previously `resolverValueNode`s, have no default value the client can compute and must be provided, or `null` for optional accounts.

**Data and remaining accounts.** Methods take the instruction data (`DataInput`, in the value format of `@codama/dynamic-codecs`) rather than arguments, and remaining accounts are provided as `Address[]` under their identifier in `.accounts()` rather than as arguments.

```diff
- client.methods.transfer({ amount, multiSigners: [a, b] }).accounts({ source, owner });
+ client.methods.transfer({ amount }).accounts({ source, owner, multiSigners: [a, b] });
```

**Reading account data.** `createProgramClient(idl, { fetchAccounts })` accepts a `FetchAccountsFn` returning the accounts default values read, e.g. a mint for its `decimals`. The new `ProgramClient.readsAccountData` tells whether it is needed, and generated client types make `fetchAccounts` required when it is `true`.

**PDAs.** `client.pdas.x(seeds, options?)` accepts the new `PdaOptions` with a `programId` overriding the program deriving the PDA, like an instruction's `pdaValueNode.programId`.

**Codegen output.** Generated types use `${Name}InstructionDataArgs` and `${Pda}Seeds`, no longer emit `${Name}Resolvers`, add `readsAccountData` to `${Program}ProgramClient`, and `MethodBuilder` loses its `TResolvers` generic and `resolvers` method.

**Re-exports.** `ArgumentsInput` is replaced by `DataInput`, and `FetchAccountsFn` and `PdaOptions` are exported. Error codes follow `@codama/errors`: `ARGUMENT_MISSING` becomes `DATA_MISSING`, `FAILED_TO_ENCODE_ARGUMENT` becomes `FAILED_TO_ENCODE_DATA`, `INVALID_ARGUMENT_INPUT` becomes `INVALID_ACCOUNT_INPUT`, `UNEXPECTED_ARGUMENT_TYPE` becomes `UNEXPECTED_VALUE_TYPE`, and `DEFAULT_VALUE_MISSING` is removed.

**Error contexts carry paths.** Errors about a node carry its `path` instead of names, e.g. `CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING`.

```diff
- console.error(`Missing account: ${err.context.accountName}`);
+ console.error(err.message); // "Missing account [programNode]system.[instructionNode]transferSol.[instructionAccountNode]source."
```

**Dependencies.** `superstruct` is removed, and `@codama/dynamic-codecs` and `@solana/codecs` are no longer runtime dependencies.
