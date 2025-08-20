---
title: Burn Checked
description: Overview of the Burn Checked instruction
---

# Burn Checked

Burns tokens by removing them from an account. `BurnChecked` does not
support accounts associated with the native mint, use `CloseAccount` instead.

This instruction differs from Burn in that the decimals value is checked
by the caller. This may be useful when creating transactions offline or
within a hardware wallet.

## Instruction accounts

| Name        | Signer | Writable | Required | Description                                                 |
| ----------- | ------ | -------- | -------- | ----------------------------------------------------------- |
| `account`   | ❌      | ✅        | ✅        | The account to burn from.                                   |
| `mint`      | ❌      | ✅        | ✅        | The token mint.                                             |
| `authority` | either | ❌        | ✅        | The account's owner/delegate or its multisignature account. |

## Instruction arguments

```ts
type BurnCheckedInstruction = { discriminator: number /* u8 */; amount: number /* u64 */; decimals: number /* u8 */ }
```