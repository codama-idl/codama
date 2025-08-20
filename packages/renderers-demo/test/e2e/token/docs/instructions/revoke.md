---
title: Revoke
description: Overview of the Revoke instruction
---

# Revoke

Revokes the delegate's authority.

## Instruction accounts

| Name     | Signer | Writable | Required | Description                                     |
| -------- | ------ | -------- | -------- | ----------------------------------------------- |
| `source` | ❌      | ✅        | ✅        | The source account.                             |
| `owner`  | either | ❌        | ✅        | The source account owner or its multisignature. |

## Instruction arguments

```ts
type RevokeInstruction = { discriminator: number /* u8 */ }
```