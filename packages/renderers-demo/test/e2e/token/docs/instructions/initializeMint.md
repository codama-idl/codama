---
title: Initialize Mint
description: Overview of the Initialize Mint instruction
---

# Initialize Mint

Initializes a new mint and optionally deposits all the newly minted
tokens in an account.

The `InitializeMint` instruction requires no signers and MUST be
included within the same Transaction as the system program's
`CreateAccount` instruction that creates the account being initialized.
Otherwise another party can acquire ownership of the uninitialized account.

## Instruction accounts

| Name   | Signer | Writable | Required | Description         |
| ------ | ------ | -------- | -------- | ------------------- |
| `mint` | ❌      | ✅        | ✅        | Token mint account. |
| `rent` | ❌      | ❌        | ✅        | Rent sysvar.        |

## Instruction arguments

```ts
type InitializeMintInstruction = {
    discriminator: number /* u8 */;
    decimals: number /* u8 */;
    mintAuthority: Address;
    freezeAuthority: Option<Address>;
}
```