---
title: Burn
description: Overview of the Burn instruction
---

# Burn

Burns tokens by removing them from an account. `Burn` does not support
accounts associated with the native mint, use `CloseAccount` instead.

## Instruction accounts

| Name        | Signer | Writable | Required | Description                                                 |
| ----------- | ------ | -------- | -------- | ----------------------------------------------------------- |
| `account`   | ❌      | ✅        | ✅        | The account to burn from.                                   |
| `mint`      | ❌      | ✅        | ✅        | The token mint.                                             |
| `authority` | either | ❌        | ✅        | The account's owner/delegate or its multisignature account. |

## Instruction arguments

```ts
type BurnInstruction = { discriminator: number /* u8 */; amount: number /* u64 */ }
```