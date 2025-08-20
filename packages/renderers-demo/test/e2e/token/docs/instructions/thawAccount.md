---
title: Thaw Account
description: Overview of the Thaw Account instruction
---

# Thaw Account

Thaw a Frozen account using the Mint's freeze_authority (if set).

## Instruction accounts

| Name      | Signer | Writable | Required | Description                                              |
| --------- | ------ | -------- | -------- | -------------------------------------------------------- |
| `account` | ❌      | ✅        | ✅        | The account to thaw.                                     |
| `mint`    | ❌      | ❌        | ✅        | The token mint.                                          |
| `owner`   | either | ❌        | ✅        | The mint freeze authority or its multisignature account. |

## Instruction arguments

```ts
type ThawAccountInstruction = { discriminator: number /* u8 */ }
```