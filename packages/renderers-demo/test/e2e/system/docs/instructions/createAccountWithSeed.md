---
title: Create Account With Seed
description: Overview of the Create Account With Seed instruction
---

# Create Account With Seed

## Instruction accounts

| Name          | Signer | Writable | Required |
| ------------- | ------ | -------- | -------- |
| `payer`       | ✅      | ✅        | ✅        |
| `newAccount`  | ❌      | ✅        | ✅        |
| `baseAccount` | ✅      | ❌        | ✅        |

## Instruction arguments

```ts
type CreateAccountWithSeedInstruction = {
    discriminator: number /* u32 */;
    base: Address;
    seed: string;
    amount: number /* u64 */;
    space: number /* u64 */;
    programAddress: Address;
}
```