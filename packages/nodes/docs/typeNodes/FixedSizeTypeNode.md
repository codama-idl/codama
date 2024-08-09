# `FixedSizeTypeNode`

A node that takes another type node as a child and fixes its byte length to the provided size. It will pad or truncate the data to match the fixed size.

This node can be used to create [`NestedTypeNodes`](./NestedTypeNode.md).

## Attributes

### Data

| Attribute | Type                  | Description                        |
| --------- | --------------------- | ---------------------------------- |
| `kind`    | `"fixedSizeTypeNode"` | The node discriminator.            |
| `size`    | `number`              | The fixed byte length of the type. |

### Children

| Attribute | Type                      | Description                                               |
| --------- | ------------------------- | --------------------------------------------------------- |
| `type`    | [`TypeNode`](./README.md) | The node type from which the byte length should be fixed. |

## Functions

### `fixedSizeTypeNode(type, size)`

Helper function that creates a `FixedSizeTypeNode` object from a type node and a fixed byte length.

```ts
const node = fixedSizeTypeNode(stringTypeNode('utf8'), 32);
```

## Examples

### Fixed UTF-8 strings

```ts
fixedSizeTypeNode(stringTypeNode('utf8'), 10);

// Hello => 0x48656C6C6F0000000000
```

### Fixed byte arrays

```ts
fixedSizeTypeNode(bytesTypeNode(), 4);

// [1, 2]          => 0x01020000
// [1, 2, 3, 4, 5] => 0x01020304
```
