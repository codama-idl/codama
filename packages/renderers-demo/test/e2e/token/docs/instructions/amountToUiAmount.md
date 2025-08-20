---
title: Amount To Ui Amount
description: Overview of the Amount To Ui Amount instruction
---

# Amount To Ui Amount

Convert an Amount of tokens to a UiAmount `string`, using the given
mint. In this version of the program, the mint can only specify the
number of decimals.

Fails on an invalid mint.

Return data can be fetched using `sol_get_return_data` and deserialized
with `String::from_utf8`.

## Instruction accounts

| Name   | Signer | Writable | Required | Description                |
| ------ | ------ | -------- | -------- | -------------------------- |
| `mint` | ❌      | ❌        | ✅        | The mint to calculate for. |

## Instruction arguments

```ts
type AmountToUiAmountInstruction = { discriminator: number /* u8 */; amount: number /* u64 */ }
```