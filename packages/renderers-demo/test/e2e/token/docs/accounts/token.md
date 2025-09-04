---
title: Token
description: Overview of the Token account
---

# Token

## Account data

```ts
type Token = {
    mint: Address;
    owner: Address;
    amount: number /* u64 */;
    delegate: Option<Address>;
    state: AccountState;
    isNative: Option<number /* u64 */>;
    delegatedAmount: number /* u64 */;
    closeAuthority: Option<Address>;
}
```

This account has a fixed size of 165 bytes.

## See also

- [AccountState](../types/accountState.md)