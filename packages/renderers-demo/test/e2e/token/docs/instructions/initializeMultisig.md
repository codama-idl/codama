---
title: Initialize Multisig
description: Overview of the Initialize Multisig instruction
---

# Initialize Multisig

Initializes a multisignature account with N provided signers.

Multisignature accounts can used in place of any single owner/delegate
accounts in any token instruction that require an owner/delegate to be
present. The variant field represents the number of signers (M)
required to validate this multisignature account.

The `InitializeMultisig` instruction requires no signers and MUST be
included within the same Transaction as the system program's
`CreateAccount` instruction that creates the account being initialized.
Otherwise another party can acquire ownership of the uninitialized account.

## Instruction accounts

| Name       | Signer | Writable | Required | Description                               |
| ---------- | ------ | -------- | -------- | ----------------------------------------- |
| `multisig` | ❌      | ✅        | ✅        | The multisignature account to initialize. |
| `rent`     | ❌      | ❌        | ✅        | Rent sysvar.                              |

## Instruction arguments

```ts
type InitializeMultisigInstruction = { discriminator: number /* u8 */; m: number /* u8 */ }
```