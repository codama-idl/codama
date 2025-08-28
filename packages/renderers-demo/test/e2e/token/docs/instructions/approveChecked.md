---
title: Approve Checked
description: Overview of the Approve Checked instruction
---

# Approve Checked

Approves a delegate. A delegate is given the authority over tokens on
behalf of the source account's owner.

This instruction differs from Approve in that the token mint and
decimals value is checked by the caller. This may be useful when
creating transactions offline or within a hardware wallet.

## Instruction accounts

| Name       | Signer | Writable | Required | Description                                             |
| ---------- | ------ | -------- | -------- | ------------------------------------------------------- |
| `source`   | ❌      | ✅        | ✅        | The source account.                                     |
| `mint`     | ❌      | ❌        | ✅        | The token mint.                                         |
| `delegate` | ❌      | ❌        | ✅        | The delegate.                                           |
| `owner`    | either | ❌        | ✅        | The source account owner or its multisignature account. |

## Instruction arguments

```ts
type ApproveCheckedInstruction = { discriminator: number /* u8 */; amount: number /* u64 */; decimals: number /* u8 */ }
```