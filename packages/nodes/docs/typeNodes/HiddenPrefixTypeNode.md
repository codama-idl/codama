# `HiddenPrefixTypeNode`

A node that wraps a type node and whilst silently consuming a prefix of constant values.

When encoding, the constant values are written before the child node. When decoding, the prefixed constant values are consumed and checked against the expected values before being discarded.

This node can be used to create [`NestedTypeNodes`](./NestedTypeNode.md).

## Attributes

### Data

| Attribute | Type                     | Description             |
| --------- | ------------------------ | ----------------------- |
| `kind`    | `"hiddenPrefixTypeNode"` | The node discriminator. |

### Children

| Attribute | Type                                                       | Description                                |
| --------- | ---------------------------------------------------------- | ------------------------------------------ |
| `type`    | [`TypeNode`](./README.md)                                  | The type node to wrap.                     |
| `prefix`  | [`ConstantValueNode`](./valueNodes/ConstantValueNode.md)[] | The array of constant prefixes to consume. |

## Functions

### `hiddenPrefixTypeNode(type, prefix)`

Helper function that creates a `HiddenPrefixTypeNode` object from a type node and an array of constant value nodes.

```ts
const node = hiddenPrefixTypeNode(numberTypeNode('u32'), [
    constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ffff')),
]);
```

## Examples

### A number prefixed with 0xFFFF

```ts
hiddenPrefixTypeNode(numberTypeNode('u32'), [constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ffff'))]);

// 42 => 0xFFFF2A000000
```

### A fixed UTF-8 string prefixed with "Hello"

```ts
hiddenPrefixTypeNode(fixedSizeTypeNode(stringTypeNode('utf8'), 10), [
    constantValueNode(stringTypeNode('utf8'), stringValueNode('Hello')),
]);

// World => 0x48656C6C6F576F726C640000000000
```
