---
title: Authorize Nonce Account
description: Overview of the Authorize Nonce Account instruction
---

# Authorize Nonce Account

## Instruction accounts

| Name             | Signer | Writable | Required |
| ---------------- | ------ | -------- | -------- |
| `nonceAccount`   | ❌      | ✅        | ✅        |
| `nonceAuthority` | ✅      | ❌        | ✅        |

## Instruction arguments

```ts
type AuthorizeNonceAccountInstruction = { discriminator: number /* u32 */; newNonceAuthority: Address }
```