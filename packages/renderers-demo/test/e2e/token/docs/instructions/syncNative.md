---
title: Sync Native
description: Overview of the Sync Native instruction
---

# Sync Native

Given a wrapped / native token account (a token account containing SOL)
updates its amount field based on the account's underlying `lamports`.
This is useful if a non-wrapped SOL account uses
`system_instruction::transfer` to move lamports to a wrapped token
account, and needs to have its token `amount` field updated.

## Instruction accounts

| Name      | Signer | Writable | Required | Description                                                    |
| --------- | ------ | -------- | -------- | -------------------------------------------------------------- |
| `account` | ❌      | ✅        | ✅        | The native token account to sync with its underlying lamports. |

## Instruction arguments

```ts
type SyncNativeInstruction = { discriminator: number /* u8 */ }
```