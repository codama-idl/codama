---
title: Allocate
description: Overview of the Allocate instruction
---

# Allocate

## Instruction accounts

| Name         | Signer | Writable | Required |
| ------------ | ------ | -------- | -------- |
| `newAccount` | ✅      | ✅        | ✅        |

## Instruction arguments

```ts
type AllocateInstruction = { discriminator: number /* u32 */; space: number /* u64 */ }
```