---
title: Withdraw Nonce Account
description: Overview of the Withdraw Nonce Account instruction
---

# Withdraw Nonce Account

## Instruction accounts

| Name                      | Signer | Writable | Required |
| ------------------------- | ------ | -------- | -------- |
| `nonceAccount`            | ❌      | ✅        | ✅        |
| `recipientAccount`        | ❌      | ✅        | ✅        |
| `recentBlockhashesSysvar` | ❌      | ❌        | ✅        |
| `rentSysvar`              | ❌      | ❌        | ✅        |
| `nonceAuthority`          | ✅      | ❌        | ✅        |

## Instruction arguments

```ts
type WithdrawNonceAccountInstruction = { discriminator: number /* u32 */; withdrawAmount: number /* u64 */ }
```