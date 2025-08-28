---
title: Initialize Multisig2
description: Overview of the Initialize Multisig2 instruction
---

# Initialize Multisig2

Like InitializeMultisig, but does not require the Rent sysvar to be provided.

## Instruction accounts

| Name       | Signer | Writable | Required | Description                               |
| ---------- | ------ | -------- | -------- | ----------------------------------------- |
| `multisig` | ❌      | ✅        | ✅        | The multisignature account to initialize. |

## Instruction arguments

```ts
type InitializeMultisig2Instruction = { discriminator: number /* u8 */; m: number /* u8 */ }
```