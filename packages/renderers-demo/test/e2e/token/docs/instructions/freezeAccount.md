---
title: Freeze Account
description: Overview of the Freeze Account instruction
---

# Freeze Account

Freeze an Initialized account using the Mint's freeze_authority (if set).

## Instruction accounts

| Name      | Signer | Writable | Required | Description                                              |
| --------- | ------ | -------- | -------- | -------------------------------------------------------- |
| `account` | ❌      | ✅        | ✅        | The account to freeze.                                   |
| `mint`    | ❌      | ❌        | ✅        | The token mint.                                          |
| `owner`   | either | ❌        | ✅        | The mint freeze authority or its multisignature account. |

## Instruction arguments

```ts
type FreezeAccountInstruction = { discriminator: number /* u8 */ }
```