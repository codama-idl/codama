# `MapTypeNode`

A node that represents key/value pairs. A key `TypeNode` and a value `TypeNode` are used to define every keys and values in the map. Map entries are encoded one after the other, with the key first followed by the value — e.g. Key A, Value A, Key B, Value B, etc.

The number of entries in the map is determined by the `count` child node.

## Attributes

### Data

| Attribute | Type            | Description             |
| --------- | --------------- | ----------------------- |
| `kind`    | `"mapTypeNode"` | The node discriminator. |

### Children

| Attribute | Type                                   | Description                               |
| --------- | -------------------------------------- | ----------------------------------------- |
| `key`     | [`TypeNode`](./README.md)              | The type of every key in the map.         |
| `value`   | [`TypeNode`](./README.md)              | The type of every value in the map.       |
| `count`   | [`CountNode`](../countNodes/README.md) | The strategy to determine the map length. |

## Functions

### `mapTypeNode(key, value, count)`

Helper function that creates a `MapTypeNode` object from a key `TypeNode`, a value `TypeNode` and a `CountNode`.

```ts
const node = mapTypeNode(publicKeyTypeNode(), numberTypeNode('u32'), prefixedCountNode(numberTypeNode('u32')));
```

## Examples

### An histogram that counts letters

```ts
mapTypeNode(
    fixedSizeTypeNode(stringTypeNode('utf8'), 1), // Key: Single UTF-8 character.
    numberTypeNode('u16'), // Value: 16-bit unsigned integer.
    prefixedCountNode(numberTypeNode('u8')), // Count: map length is prefixed with a u8.
);

// { A: 42, B: 1, C: 16 } => 0x03000000412A00420100431000
```
