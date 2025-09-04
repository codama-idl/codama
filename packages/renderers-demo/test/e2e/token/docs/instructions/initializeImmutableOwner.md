---
title: Initialize Immutable Owner
description: Overview of the Initialize Immutable Owner instruction
---

# Initialize Immutable Owner

Initialize the Immutable Owner extension for the given token account

Fails if the account has already been initialized, so must be called
before `InitializeAccount`.

No-ops in this version of the program, but is included for compatibility
with the Associated Token Account program.

## Instruction accounts

| Name      | Signer | Writable | Required | Description                |
| --------- | ------ | -------- | -------- | -------------------------- |
| `account` | ❌      | ✅        | ✅        | The account to initialize. |

## Instruction arguments

```ts
type InitializeImmutableOwnerInstruction = { discriminator: number /* u8 */ }
```