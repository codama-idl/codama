# `SizePrefixTypeNode`

A node that limits the size of a child node using a size prefix that stores the size of the child node in bytes.

When encoding, the size of the child node is written before the child node itself. When decoding, the size is read first and used to determine the length of the child node.

This node can be used to create [`NestedTypeNodes`](./NestedTypeNode.md).

## Attributes

### Data

| Attribute | Type                   | Description             |
| --------- | ---------------------- | ----------------------- |
| `kind`    | `"sizePrefixTypeNode"` | The node discriminator. |

### Children

| Attribute | Type                                                                             | Description                                            |
| --------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `type`    | [`TypeNode`](./README.md)                                                        | The child node to size.                                |
| `prefix`  | [`NestedTypeNode`](./NestedTypeNode.md)<[`NumberTypeNode`](./NumberTypeNode.md)> | The node used to determine the size of the child node. |

## Functions

### `sizePrefixTypeNode(type, prefix)`

Helper function that creates a `SizePrefixTypeNode` object from a type node and a `NumberTypeNode` prefix.

```ts
const node = sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32'));
```

## Examples

### A UTF-8 string prefixed with a u16 size

```ts
sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u16'));

// ""      => 0x0000
// "Hello" => 0x050048656C6C6F
```
