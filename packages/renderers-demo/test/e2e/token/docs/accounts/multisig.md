---
title: Multisig
description: Overview of the Multisig account
---

# Multisig

## Account data

```ts
type Multisig = { m: number /* u8 */; n: number /* u8 */; isInitialized: boolean; signers: Array<Address> }
```

This account has a fixed size of 355 bytes.