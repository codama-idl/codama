---
title: Set Authority
description: Overview of the Set Authority instruction
---

# Set Authority

Sets a new authority of a mint or account.

## Instruction accounts

| Name    | Signer | Writable | Required | Description                                                                           |
| ------- | ------ | -------- | -------- | ------------------------------------------------------------------------------------- |
| `owned` | ❌      | ✅        | ✅        | The mint or account to change the authority of.                                       |
| `owner` | either | ❌        | ✅        | The current authority or the multisignature account of the mint or account to update. |

## Instruction arguments

```ts
type SetAuthorityInstruction = { discriminator: number /* u8 */; authorityType: AuthorityType; newAuthority: Option<Address> }
```

## See also

- [AuthorityType](../types/authorityType.md)