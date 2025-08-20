---
title: Initialize Account3
description: Overview of the Initialize Account3 instruction
---

# Initialize Account3

Like InitializeAccount2, but does not require the Rent sysvar to be provided.

## Instruction accounts

| Name      | Signer | Writable | Required | Description                                    |
| --------- | ------ | -------- | -------- | ---------------------------------------------- |
| `account` | ❌      | ✅        | ✅        | The account to initialize.                     |
| `mint`    | ❌      | ❌        | ✅        | The mint this account will be associated with. |

## Instruction arguments

```ts
type InitializeAccount3Instruction = { discriminator: number /* u8 */; owner: Address }
```