# `SolAmountTypeNode`

A node that wraps a [`NumberTypeNode`](./NumberTypeNode.md) to mark it as representing a Solana amount in lamports.

Note that this node is equivalent to using a [`AmountTypeNode`](./AmountTypeNode.md) with 9 decimals and `SOL` as the unit.

## Attributes

### Data

| Attribute | Type                  | Description             |
| --------- | --------------------- | ----------------------- |
| `kind`    | `"solAmountTypeNode"` | The node discriminator. |

### Children

| Attribute | Type                                                                             | Description              |
| --------- | -------------------------------------------------------------------------------- | ------------------------ |
| `number`  | [`NestedTypeNode`](./NestedTypeNode.md)<[`NumberTypeNode`](./NumberTypeNode.md)> | The number node to wrap. |

## Functions

### `solAmountTypeNode(number)`

Helper function that creates a `SolAmountTypeNode` object from a `NumberTypeNode`.

```ts
const node = solAmountTypeNode(numberTypeNode('u64'));
```

## Examples

### u64 Solana amounts

```ts
solAmountTypeNode(numberTypeNode('u64'));

// 1.5 SOL => 0x002F685900000000
// 300 SOL => 0x00B864D945000000
```
