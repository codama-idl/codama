---
title: Initialize Account2
description: Overview of the Initialize Account2 instruction
---

# Initialize Account2

Like InitializeAccount, but the owner pubkey is passed via instruction
data rather than the accounts list. This variant may be preferable
when using Cross Program Invocation from an instruction that does
not need the owner's `AccountInfo` otherwise.

## Instruction accounts

| Name      | Signer | Writable | Required | Description                                    |
| --------- | ------ | -------- | -------- | ---------------------------------------------- |
| `account` | ❌      | ✅        | ✅        | The account to initialize.                     |
| `mint`    | ❌      | ❌        | ✅        | The mint this account will be associated with. |
| `rent`    | ❌      | ❌        | ✅        | Rent sysvar.                                   |

## Instruction arguments

```ts
type InitializeAccount2Instruction = { discriminator: number /* u8 */; owner: Address }
```