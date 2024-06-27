# `BooleanTypeNode`

A node that represents a boolean value using a `NumberTypeNode`. If the number is `1`, then the boolean is `true`, otherwise it is `false`.

## Attributes

### Data

| Attribute | Type                | Description             |
| --------- | ------------------- | ----------------------- |
| `kind`    | `"booleanTypeNode"` | The node discriminator. |

### Children

| Attribute | Type                                                                             | Description                                    |
| --------- | -------------------------------------------------------------------------------- | ---------------------------------------------- |
| `size`    | [`NestedTypeNode`](./NestedTypeNode.md)<[`NumberTypeNode`](./NumberTypeNode.md)> | The number node used to represent the boolean. |

## Functions

### `booleanTypeNode(size?)`

Helper function that creates a `BooleanTypeNode` object from a `NumberTypeNode` (defaulting to `u8` if not provided).

```ts
const node = booleanTypeNode(numberTypeNode('u32'));
const implicitU8Node = booleanTypeNode(); // u8 by default
```

## Examples

### u8 booleans

```ts
booleanTypeNode();

// true  => 0x01
// false => 0x00
```

### u32 booleans

```ts
booleanTypeNode(numberTypeNode('u32'));

// true  => 0x01000000
// false => 0x00000000
```
