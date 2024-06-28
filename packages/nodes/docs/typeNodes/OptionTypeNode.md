# `OptionTypeNode`

A node that represents an optional item using a child `TypeNode`. The item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on the value of a prefixed `NumberTypeNode`. If the prefixed value is `1`, the item is present and the child node should be encoded/decoded accordingly. However, if the prefixed value is `0`, the item is absent and no further encoding/decoding should be performed.

However, if the `fixed` option is set to `true`, the encoded `None` value will be padded with zeroes matching the length of the fixed-size item to ensure the option type is fixed-size regardless of the presence of the item.

## Attributes

### Data

| Attribute | Type               | Description                                                                                                                                                                                                  |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `kind`    | `"optionTypeNode"` | The node discriminator.                                                                                                                                                                                      |
| `fixed`   | `boolean`          | (Optional) Whether or not we should pad the `None` value with zeroes matching the fixed length of the item. This option must only be set to `true` if the `item` node is of fixed-size. Defaults to `false`. |

### Children

| Attribute | Type                                                                             | Description                                 |
| --------- | -------------------------------------------------------------------------------- | ------------------------------------------- |
| `item`    | [`TypeNode`](./README.md)                                                        | The item that may exist.                    |
| `prefix`  | [`NestedTypeNode`](./NestedTypeNode.md)<[`NumberTypeNode`](./NumberTypeNode.md)> | The number type node to use for the prefix. |

## Functions

### `optionTypeNode(item, options?)`

Helper function that creates a `OptionTypeNode` object from the item `TypeNode` and an optional configuration object.

```ts
const node = optionTypeNode(publicKeyTypeNode());
const nodeWithCustomPrefix = optionTypeNode(publicKeyTypeNode(), { prefix: numberTypeNode('u16') });
const fixedNode = optionTypeNode(publicKeyTypeNode(), { fixed: true });
```

## Examples

### An optional UTF-8 with a u16 prefix

```ts
optionTypeNode(stringTypeNode('UTF-8'), { prefix: numberTypeNode('u16') });

// None          => 0x0000
// Some("Hello") => 0x010048656C6C6F
```

### A fixed optional u32 number

```ts
optionTypeNode(numberTypeNode('u32'), { fixed: true });

// None     => 0x0000000000
// Some(42) => 0x012A000000
```
