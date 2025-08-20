---
title: Assign
description: Overview of the Assign instruction
---

# Assign

## Instruction accounts

| Name      | Signer | Writable | Required |
| --------- | ------ | -------- | -------- |
| `account` | ✅      | ✅        | ✅        |

## Instruction arguments

```ts
type AssignInstruction = { discriminator: number /* u32 */; programAddress: Address }
```