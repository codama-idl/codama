# `ZeroableOptionTypeNode`

A node that represents an optional item using a child `TypeNode` of fixed-size. Contrary to the [`OptionTypeNode`](./OptionTypeNode.md), this node does not use a number prefix to determine if the item is present or not. Instead, it checks whether the fixed-size item is filled with zeroes. If it is, then we consider the item to be absent — i.e. `None` — otherwise, it is present — i.e. `Some<T>` — and the child node should be encoded/decoded accordingly.

An optional `zeroValue` constant node can also be provided to determine the customise the zero value of the fixed-size item. For instance if the `zeroValue` is `0xFFFFFFFF`, then a buffer with this value will be considered as `None` and anyting else will be considered as `Some<T>`.

## Attributes

### Data

| Attribute | Type                       | Description             |
| --------- | -------------------------- | ----------------------- |
| `kind`    | `"zeroableOptionTypeNode"` | The node discriminator. |

### Children

| Attribute   | Type                                                     | Description                                                                                              |
| ----------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `item`      | [`TypeNode`](./README.md)                                | The item that may exist. Must be of fixed-size.                                                          |
| `zeroValue` | [`ConstantValueNode`](./valueNodes/ConstantValueNode.md) | (Optional) The constant value representing `None`. Defaults to filling the size of the item with zeroes. |

## Functions

### `zeroableOptionTypeNode(item, zeroValue?)`

Helper function that creates a `ZeroableOptionTypeNode` object from a `TypeNode` and an optional zero value.

```ts
const node = zeroableOptionTypeNode(publicKeyTypeNode());

const nodeWithZeroValue = zeroableOptionTypeNode(
    numbetypeNode('u32'),
    constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ffffffff')),
);
```

## Examples

### a u32 zeroable option

```ts
zeroableOptionTypeNode(numbetypeNode('u32'));

// None     => 0x00000000
// Some(42) => 0x2A000000
```

### a u32 zeroable option with a custom zero value

```ts
zeroableOptionTypeNode(numbetypeNode('u32'), constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ffffffff')));

// None     => 0xFFFFFFFF
// Some(42) => 0x2A000000
```
