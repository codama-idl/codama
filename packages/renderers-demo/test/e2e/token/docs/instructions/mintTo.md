---
title: Mint To
description: Overview of the Mint To instruction
---

# Mint To

Mints new tokens to an account. The native mint does not support minting.

## Instruction accounts

| Name            | Signer | Writable | Required | Description                                                 |
| --------------- | ------ | -------- | -------- | ----------------------------------------------------------- |
| `mint`          | ❌      | ✅        | ✅        | The mint account.                                           |
| `token`         | ❌      | ✅        | ✅        | The account to mint tokens to.                              |
| `mintAuthority` | either | ❌        | ✅        | The mint's minting authority or its multisignature account. |

## Instruction arguments

```ts
type MintToInstruction = { discriminator: number /* u8 */; amount: number /* u64 */ }
```