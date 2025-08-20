---
title: Upgrade Nonce Account
description: Overview of the Upgrade Nonce Account instruction
---

# Upgrade Nonce Account

## Instruction accounts

| Name           | Signer | Writable | Required |
| -------------- | ------ | -------- | -------- |
| `nonceAccount` | ❌      | ✅        | ✅        |

## Instruction arguments

```ts
type UpgradeNonceAccountInstruction = { discriminator: number /* u32 */ }
```