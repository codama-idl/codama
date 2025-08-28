---
title: Initialize Mint2
description: Overview of the Initialize Mint2 instruction
---

# Initialize Mint2

Like [`InitializeMint`], but does not require the Rent sysvar to be provided.

## Instruction accounts

| Name   | Signer | Writable | Required | Description             |
| ------ | ------ | -------- | -------- | ----------------------- |
| `mint` | ❌      | ✅        | ✅        | The mint to initialize. |

## Instruction arguments

```ts
type InitializeMint2Instruction = {
    discriminator: number /* u8 */;
    decimals: number /* u8 */;
    mintAuthority: Address;
    freezeAuthority: Option<Address>;
}
```