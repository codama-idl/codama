---
title: Ui Amount To Amount
description: Overview of the Ui Amount To Amount instruction
---

# Ui Amount To Amount

Convert a UiAmount of tokens to a little-endian `u64` raw Amount, using
the given mint. In this version of the program, the mint can only
specify the number of decimals.

Return data can be fetched using `sol_get_return_data` and deserializing
the return data as a little-endian `u64`.

## Instruction accounts

| Name   | Signer | Writable | Required | Description                |
| ------ | ------ | -------- | -------- | -------------------------- |
| `mint` | ❌      | ❌        | ✅        | The mint to calculate for. |

## Instruction arguments

```ts
type UiAmountToAmountInstruction = { discriminator: number /* u8 */; uiAmount: string }
```