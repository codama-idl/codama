---
title: Create Account
description: Overview of the Create Account instruction
---

# Create Account

## Instruction accounts

| Name         | Signer | Writable | Required |
| ------------ | ------ | -------- | -------- |
| `payer`      | ✅      | ✅        | ✅        |
| `newAccount` | ✅      | ✅        | ✅        |

## Instruction arguments

```ts
type CreateAccountInstruction = {
    discriminator: number /* u32 */;
    lamports: number /* u64 */;
    space: number /* u64 */;
    programAddress: Address;
}
```