---
title: Transfer
description: Overview of the Transfer instruction
---

# Transfer

Transfers tokens from one account to another either directly or via a delegate.
If this account is associated with the native mint then equal amounts
of SOL and Tokens will be transferred to the destination account.

## Instruction accounts

| Name          | Signer | Writable | Required | Description                                                        |
| ------------- | ------ | -------- | -------- | ------------------------------------------------------------------ |
| `source`      | ❌      | ✅        | ✅        | The source account.                                                |
| `destination` | ❌      | ✅        | ✅        | The destination account.                                           |
| `authority`   | either | ❌        | ✅        | The source account's owner/delegate or its multisignature account. |

## Instruction arguments

```ts
type TransferInstruction = { discriminator: number /* u8 */; amount: number /* u64 */ }
```