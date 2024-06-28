# `HiddenSuffixTypeNode`

A node that wraps a type node and whilst silently consuming a suffix of constant values.

When encoding, the constant values are written after the child node. When decoding, the suffixed constant values are consumed and checked against the expected values before being discarded.

This node can be used to create [`NestedTypeNodes`](./NestedTypeNode.md).

## Attributes

### Data

| Attribute | Type                     | Description             |
| --------- | ------------------------ | ----------------------- |
| `kind`    | `"hiddenSuffixTypeNode"` | The node discriminator. |

### Children

| Attribute | Type                                                       | Description                                |
| --------- | ---------------------------------------------------------- | ------------------------------------------ |
| `type`    | [`TypeNode`](./README.md)                                  | The type node to wrap.                     |
| `suffix`  | [`ConstantValueNode`](./valueNodes/ConstantValueNode.md)[] | The array of constant suffixes to consume. |

## Functions

### `hiddenSuffixTypeNode(type, suffix)`

Helper function that creates a `HiddenSuffixTypeNode` object from a type node and an array of constant value nodes.

```ts
const node = hiddenSuffixTypeNode(numberTypeNode('u32'), [
    constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ffff')),
]);
```

## Examples

### A number suffixed with 0xFFFF

```ts
hiddenSuffixTypeNode(numberTypeNode('u32'), [constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ffff'))]);

// 42 => 0x2A000000FFFF
```

### A fixed UTF-8 string suffixed with "Hello"

```ts
hiddenSuffixTypeNode(fixedSizeTypeNode(stringTypeNode('utf8'), 10), [
    constantValueNode(stringTypeNode('utf8'), stringValueNode('Hello')),
]);

// World => 0x576F726C64000000000048656c6c6F
```
