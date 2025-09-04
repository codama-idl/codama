---
title: Transfer Sol
description: Overview of the Transfer Sol instruction
---

# Transfer Sol

## Instruction accounts

| Name          | Signer | Writable | Required |
| ------------- | ------ | -------- | -------- |
| `source`      | ✅      | ✅        | ✅        |
| `destination` | ❌      | ✅        | ✅        |

## Instruction arguments

```ts
type TransferSolInstruction = { discriminator: number /* u32 */; amount: number /* u64 */ }
```