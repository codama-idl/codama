---
title: Mint To Checked
description: Overview of the Mint To Checked instruction
---

# Mint To Checked

Mints new tokens to an account. The native mint does not support minting.

This instruction differs from MintTo in that the decimals value is
checked by the caller. This may be useful when creating transactions
offline or within a hardware wallet.

## Instruction accounts

| Name            | Signer | Writable | Required | Description                                                 |
| --------------- | ------ | -------- | -------- | ----------------------------------------------------------- |
| `mint`          | ❌      | ✅        | ✅        | The mint.                                                   |
| `token`         | ❌      | ✅        | ✅        | The account to mint tokens to.                              |
| `mintAuthority` | either | ❌        | ✅        | The mint's minting authority or its multisignature account. |

## Instruction arguments

```ts
type MintToCheckedInstruction = { discriminator: number /* u8 */; amount: number /* u64 */; decimals: number /* u8 */ }
```