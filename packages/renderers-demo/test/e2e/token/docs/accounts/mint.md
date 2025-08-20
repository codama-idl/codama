---
title: Mint
description: Overview of the Mint account
---

# Mint

## Account data

```ts
type Mint = {
    mintAuthority: Option<Address>;
    supply: number /* u64 */;
    decimals: number /* u8 */;
    isInitialized: boolean;
    freezeAuthority: Option<Address>;
}
```

This account has a fixed size of 82 bytes.