---
title: Transfer Checked
description: Overview of the Transfer Checked instruction
---

# Transfer Checked

Transfers tokens from one account to another either directly or via a
delegate. If this account is associated with the native mint then equal
amounts of SOL and Tokens will be transferred to the destination account.

This instruction differs from Transfer in that the token mint and
decimals value is checked by the caller. This may be useful when
creating transactions offline or within a hardware wallet.

## Instruction accounts

| Name          | Signer | Writable | Required | Description                                                        |
| ------------- | ------ | -------- | -------- | ------------------------------------------------------------------ |
| `source`      | ❌      | ✅        | ✅        | The source account.                                                |
| `mint`        | ❌      | ❌        | ✅        | The token mint.                                                    |
| `destination` | ❌      | ✅        | ✅        | The destination account.                                           |
| `authority`   | either | ❌        | ✅        | The source account's owner/delegate or its multisignature account. |

## Instruction arguments

```ts
type TransferCheckedInstruction = { discriminator: number /* u8 */; amount: number /* u64 */; decimals: number /* u8 */ }
```