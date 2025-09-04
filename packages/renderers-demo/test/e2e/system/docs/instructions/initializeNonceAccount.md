---
title: Initialize Nonce Account
description: Overview of the Initialize Nonce Account instruction
---

# Initialize Nonce Account

## Instruction accounts

| Name                      | Signer | Writable | Required |
| ------------------------- | ------ | -------- | -------- |
| `nonceAccount`            | ❌      | ✅        | ✅        |
| `recentBlockhashesSysvar` | ❌      | ❌        | ✅        |
| `rentSysvar`              | ❌      | ❌        | ✅        |

## Instruction arguments

```ts
type InitializeNonceAccountInstruction = { discriminator: number /* u32 */; nonceAuthority: Address }
```