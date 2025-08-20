---
title: Get Account Data Size
description: Overview of the Get Account Data Size instruction
---

# Get Account Data Size

Gets the required size of an account for the given mint as a
little-endian `u64`.

Return data can be fetched using `sol_get_return_data` and deserializing
the return data as a little-endian `u64`.

## Instruction accounts

| Name   | Signer | Writable | Required | Description                |
| ------ | ------ | -------- | -------- | -------------------------- |
| `mint` | ❌      | ❌        | ✅        | The mint to calculate for. |

## Instruction arguments

```ts
type GetAccountDataSizeInstruction = { discriminator: number /* u8 */ }
```