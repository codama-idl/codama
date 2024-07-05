# `SentinelTypeNode`

A node that limits the size of a child node using a sentinel value. The sentinel value is a constant value that is used to determine the end of the child node.

When encoding, the sentinel value is written after the child node. When decoding, the child node is decoded until the sentinel value is encountered, at which point the decoding stops and the sentinel value is discarded.

Note that, for the `SentinelTypeNode` to work, the sentinel value must not be included in the child node's encoding.

This node can be used to create [`NestedTypeNodes`](./NestedTypeNode.md).

## Attributes

### Data

| Attribute | Type                 | Description             |
| --------- | -------------------- | ----------------------- |
| `kind`    | `"sentinelTypeNode"` | The node discriminator. |

### Children

| Attribute  | Type                                                     | Description                                           |
| ---------- | -------------------------------------------------------- | ----------------------------------------------------- |
| `type`     | [`TypeNode`](./README.md)                                | The child node to limit.                              |
| `sentinel` | [`ConstantValueNode`](./valueNodes/ConstantValueNode.md) | The sentinel value marking the end of the child node. |

## Functions

### `sentinelTypeNode(type, sentinel)`

Helper function that creates a `SentinelTypeNode` object from a type node and a constant value node.

```ts
const sentinel = constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ff'));
const node = sentinelTypeNode(stringTypeNode('utf8'), sentinel);
```

## Examples

### A UTF-8 string terminated by 0xFF

```ts
sentinelTypeNode(stringTypeNode('utf8'), constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ff')));

// Hello => 0x48656C6C6FFF
```
