---
title: Transfer Sol With Seed
description: Overview of the Transfer Sol With Seed instruction
---

# Transfer Sol With Seed

## Instruction accounts

| Name          | Signer | Writable | Required |
| ------------- | ------ | -------- | -------- |
| `source`      | ❌      | ✅        | ✅        |
| `baseAccount` | ✅      | ❌        | ✅        |
| `destination` | ❌      | ✅        | ✅        |

## Instruction arguments

```ts
type TransferSolWithSeedInstruction = { discriminator: number /* u32 */; amount: number /* u64 */; fromSeed: string; fromOwner: Address }
```