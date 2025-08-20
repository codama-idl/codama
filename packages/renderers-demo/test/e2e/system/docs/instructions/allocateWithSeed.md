---
title: Allocate With Seed
description: Overview of the Allocate With Seed instruction
---

# Allocate With Seed

## Instruction accounts

| Name          | Signer | Writable | Required |
| ------------- | ------ | -------- | -------- |
| `newAccount`  | ❌      | ✅        | ✅        |
| `baseAccount` | ✅      | ❌        | ✅        |

## Instruction arguments

```ts
type AllocateWithSeedInstruction = {
    discriminator: number /* u32 */;
    base: Address;
    seed: string;
    space: number /* u64 */;
    programAddress: Address;
}
```