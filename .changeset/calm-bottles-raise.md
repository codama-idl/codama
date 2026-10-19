---
'@codama/dynamic-address-resolution': major
---

Resolve instruction accounts and standalone PDAs from their path within a Codama v2 IDL, including `dataValueNode` paths, `injectedValueNode`s, `programLinkNode`s and cross-program PDAs. Default values may now read account data through an injected `fetchAccounts` function, and a `linkables` option avoids recording the linkable nodes of the IDL on each call.

**BREAKING CHANGES**

**Path-based APIs.** `resolveInstructionAccountAddress` takes the `path` of the instruction account instead of `root`, `ixNode` and `ixAccountNode`, and `resolveStandalonePda` takes a single input with the `path` of the PDA, its `seedsInput` and an optional `programId` overriding the program deriving it.

```diff
- await resolveInstructionAccountAddress({ root, ixNode, ixAccountNode, accountsInput, argumentsInput });
+ await resolveInstructionAccountAddress({ path: [root, program, ix, account], accountsInput, dataInput });
- await resolveStandalonePda(root, pdaNode, seeds);
+ await resolveStandalonePda({ path: [root, program, pdaNode], seedsInput: seeds, programId });
```

**Data instead of arguments.** `argumentsInput` is renamed `dataInput` and `ArgumentsInput` is renamed `DataInput`, using the value format of `@codama/dynamic-codecs`. Remaining accounts are provided in `accountsInput` as `Address[]` under their identifier, and named accounts given a list throw `UNEXPECTED_ADDRESS_TYPE`.

**Resolvers removed.** `ResolverFn`, `ResolversInput`, `ResolverFnInput` and `collectResolverNames` are removed, since v2 IDLs have no `resolverValueNode`. Inputs carrying a `codama.resolver` plugin have no default value and must be provided.

**Codec helpers removed.** `createCodecInputTransformer`, `createDefaultValueEncoderVisitor` and `DEFAULT_VALUE_ENCODER_SUPPORTED_NODE_KINDS` are removed, since the codecs of `@codama/dynamic-codecs` now accept these inputs directly.

**Reading account data.** `accountDataValueNode` defaults and data paths crossing an account link with a `.data` segment, e.g. `mint.data.decimals`, are resolved by fetching accounts through a `fetchAccounts` option (`FetchAccountsFn`, returning accounts that must exist) instead of throwing. New `getBatchedFetchAccounts` shares batches and a cache across resolutions, `readsAccountData(path)` tells whether an instruction needs `fetchAccounts`, and `resolveInstructionDataDefaultValues` resolves data defaults injected from account data for the `resolvedDefaultValues` codec option.

**Resolution changes.** Seeds are encoded using their declared type, conditions compare values with `isValueEqual`, and conditions without a `value` now pass when the referenced input exists rather than when it is truthy. `accountBumpValueNode` defaults are not auto-resolvable.

**Codegen output.** `${Name}Args` becomes `${Name}InstructionDataArgs`, `${Pda}PdaSeeds` becomes `${Pda}Seeds`, `${Name}Resolvers` is no longer emitted, remaining accounts are emitted as named `Address[]` in `${Name}Accounts`, and accounts defaulting to account data become optional. The `${Program}Pdas` functions accept an optional `{ programId?: Address }`. `ResolutionRefs` replaces `argsRef`, `hasArgs` and `hasRequiredArgs` with `dataRef`, `hasData` and `hasRequiredData`, and drops `hasRequiredRemainingAccounts`, `hasResolvers` and `resolversRef`.
