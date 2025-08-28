---
title: Assign With Seed
description: Overview of the Assign With Seed instruction
---

# Assign With Seed

## Instruction accounts

| Name          | Signer | Writable | Required |
| ------------- | ------ | -------- | -------- |
| `account`     | ❌      | ✅        | ✅        |
| `baseAccount` | ✅      | ❌        | ✅        |

## Instruction arguments

```ts
type AssignWithSeedInstruction = { discriminator: number /* u32 */; base: Address; seed: string; programAddress: Address }
```