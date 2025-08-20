---
title: Approve
description: Overview of the Approve instruction
---

# Approve

Approves a delegate. A delegate is given the authority over tokens on
behalf of the source account's owner.

## Instruction accounts

| Name       | Signer | Writable | Required | Description                                             |
| ---------- | ------ | -------- | -------- | ------------------------------------------------------- |
| `source`   | ❌      | ✅        | ✅        | The source account.                                     |
| `delegate` | ❌      | ❌        | ✅        | The delegate.                                           |
| `owner`    | either | ❌        | ✅        | The source account owner or its multisignature account. |

## Instruction arguments

```ts
type ApproveInstruction = { discriminator: number /* u8 */; amount: number /* u64 */ }
```