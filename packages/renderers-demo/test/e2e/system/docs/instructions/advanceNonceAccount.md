---
title: Advance Nonce Account
description: Overview of the Advance Nonce Account instruction
---

# Advance Nonce Account

## Instruction accounts

| Name                      | Signer | Writable | Required |
| ------------------------- | ------ | -------- | -------- |
| `nonceAccount`            | ❌      | ✅        | ✅        |
| `recentBlockhashesSysvar` | ❌      | ❌        | ✅        |
| `nonceAuthority`          | ✅      | ❌        | ✅        |

## Instruction arguments

```ts
type AdvanceNonceAccountInstruction = { discriminator: number /* u32 */ }
```