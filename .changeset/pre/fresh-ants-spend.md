---
'@codama/dynamic-instructions': major
---

Rewrite the instruction display on the decoded and formatted nodes of `@codama/dynamic-codecs`, covering the full v2 display spec: data paths, account data read across account links with a `.data` segment, value labels, address units and `formatDegraded`. Account data now comes from a `DisplayAccountMap`, fetched in rounds by `getDisplayAccountMap`, so the same display runs online or offline from a `DisplayDictionary`.

**BREAKING CHANGES**

**Synchronous display from parsed instructions.** `getInstructionDisplayFromParsedInstruction` is now synchronous and reads account data from an `accounts` option (`DisplayAccountMap`) instead of fetching it. Its options are those of `formatDecodedNode`, minus `resolveInjectedValue`, plus `accounts` and `linkables`, e.g. `formatAddress`, `numberFormat` or `formatDegraded`, which defaults to the raw value followed by `(raw)`.

**Batched fetching.** `getInstructionDisplay(root, instruction, options)` takes a batched `fetchAccounts` option instead of `fetchAccount`, and the display's `FetchAccountsFn` is renamed `FetchMaybeAccountsFn`, since `FetchAccountsFn` now names the build-time fetcher returning accounts that must exist. `getDisplayAccountMap` accepts `{ accounts, linkables }` options and fetches in rounds, e.g. a token account then its mint. Accounts that do not match the discriminators of their linked account, or do not decode, are treated as unavailable.

```diff
- await getInstructionDisplay(root, instruction, { fetchAccount: a => fetchEncodedAccount(rpc, a) });
+ await getInstructionDisplay(root, instruction, { fetchAccounts: a => fetchEncodedAccounts(rpc, a) });
- const display = await getInstructionDisplayFromParsedInstruction(root, parsed, { fetchAccount });
+ const accounts = await getDisplayAccountMap(root, parsed, fetchAccounts);
+ const display = getInstructionDisplayFromParsedInstruction(root, parsed, { accounts });
```

**Removed exports.** `getRequiredAccountsForDisplay`, `buildDisplayContext`, `buildBaseDisplayContext`, `listFallback`, `interpolateIntent`, `formatArgumentValue`, `formatAmountValue`, `formatDateTimeValue`, `formatDurationValue`, `formatStringValue`, `resolveInjectedValue`, `resolveConsumedMemberNames`, `resolveDisplayType` and the `DisplayContext`, `FetchAccountFn`, `ResolveAccountDataFn`, `ResolveDefinedTypeFn`, `FormattedArgumentValue`, `ResolvedDisplayType` and `ResolvedDisplayValue` types are removed. The `DisplayDictionary`, `DisplayAccountMap` and `DisplayNamedMap` types and their codecs are unchanged.

**Visible changes.** Every address, in public key fields, account rows, placeholders and address units, goes through `formatAddress`. Value labels apply in rows and sentences. Nested structs show as `Label: text` rather than JSON, and enum variants show their labels, with their data in parentheses. Empty values show as `Empty`. Sets of addresses now show one numbered row per address, like lists. Remaining accounts are shown as `Remaining Account` even when the IDL declares no groups for them. Members skipped `whenInjected` are only hidden when a row that is always shown presents their value, and hidden fields no longer trigger account fetches.
