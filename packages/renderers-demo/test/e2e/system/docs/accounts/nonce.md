---
title: Nonce
description: Overview of the Nonce account
---

# Nonce

## Account data

```ts
type Nonce = {
    version: NonceVersion;
    state: NonceState;
    authority: Address;
    blockhash: Address;
    lamportsPerSignature: number /* u64 */;
}
```

This account has a fixed size of 80 bytes.

## See also

- [NonceVersion](../types/nonceVersion.md)
- [NonceState](../types/nonceState.md)