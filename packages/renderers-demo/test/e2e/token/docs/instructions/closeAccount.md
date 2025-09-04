---
title: Close Account
description: Overview of the Close Account instruction
---

# Close Account

Close an account by transferring all its SOL to the destination account.
Non-native accounts may only be closed if its token amount is zero.

## Instruction accounts

| Name          | Signer | Writable | Required | Description                                        |
| ------------- | ------ | -------- | -------- | -------------------------------------------------- |
| `account`     | ❌      | ✅        | ✅        | The account to close.                              |
| `destination` | ❌      | ✅        | ✅        | The destination account.                           |
| `owner`       | either | ❌        | ✅        | The account's owner or its multisignature account. |

## Instruction arguments

```ts
type CloseAccountInstruction = { discriminator: number /* u8 */ }
```