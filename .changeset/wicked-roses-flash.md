---
'@codama/dynamic-parsers': major
'@codama/dynamic-instructions': patch
---

Label the accounts of parsed instructions according to the `optionalAccountStrategy` of the instruction, so absent optional accounts are never named and accounts after them are never mislabelled. Accounts whose identity is ambiguous are returned in a new `unidentifiedAccounts` list, which the instruction display of `@codama/dynamic-instructions` shows as `Unidentified Account`.

**BREAKING CHANGES**

**Absent optional accounts are left out of `accounts`.** With the `programId` strategy, the default, an optional account passed as the address of the program is no longer named after that address.

```diff
 // Accounts: source, referrer (optional), destination. Metas: [A, programAddress, B].
- parsed.accounts; // [{ address: A, identifier: 'source' }, { address: programAddress, identifier: 'referrer' }, { address: B, identifier: 'destination' }]
+ parsed.accounts; // [{ address: A, identifier: 'source' }, { address: B, identifier: 'destination' }]
```

**Accounts are named by identity rather than position with the `omitted` strategy.** The accounts after an omitted optional account are named after their shifted position. When the omitted optional accounts cannot be told from the number of metas, e.g. one of two optional accounts, or remaining accounts may follow, the ambiguous metas are returned in the new `unidentifiedAccounts` list of `ParsedInstruction` instead of `accounts` or `remainingAccounts`.

```diff
 // Accounts: source, referrer (optional), memo (optional), destination. Metas: [A, B, C].
- parsed.accounts; // [{ address: A, identifier: 'source' }, { address: B, identifier: 'referrer' }, { address: C, identifier: 'memo' }]
+ parsed.accounts; // [{ address: A, identifier: 'source' }, { address: C, identifier: 'destination' }]
+ parsed.unidentifiedAccounts; // [{ address: B }]
```

**`ParseDataOptions` no longer accepts `resolvedDefaultValues`.** That codec option only applies when encoding, so parsers never used it.
