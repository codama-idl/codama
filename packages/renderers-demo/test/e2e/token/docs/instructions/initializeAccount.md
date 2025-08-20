---
title: Initialize Account
description: Overview of the Initialize Account instruction
---

# Initialize Account

Initializes a new account to hold tokens. If this account is associated
with the native mint then the token balance of the initialized account
will be equal to the amount of SOL in the account. If this account is
associated with another mint, that mint must be initialized before this
command can succeed.

The `InitializeAccount` instruction requires no signers and MUST be
included within the same Transaction as the system program's
`CreateAccount` instruction that creates the account being initialized.
Otherwise another party can acquire ownership of the uninitialized account.

## Instruction accounts

| Name      | Signer | Writable | Required | Description                                    |
| --------- | ------ | -------- | -------- | ---------------------------------------------- |
| `account` | ❌      | ✅        | ✅        | The account to initialize.                     |
| `mint`    | ❌      | ❌        | ✅        | The mint this account will be associated with. |
| `owner`   | ❌      | ❌        | ✅        | The new account's owner/multisignature.        |
| `rent`    | ❌      | ❌        | ✅        | Rent sysvar.                                   |

## Instruction arguments

```ts
type InitializeAccountInstruction = { discriminator: number /* u8 */ }
```