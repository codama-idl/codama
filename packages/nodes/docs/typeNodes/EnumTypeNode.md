# `EnumTypeNode`

A node that can represent data in various states using enum variants. Each variant has a unique name and can have associated data.

## Attributes

### Data

| Attribute | Type             | Description             |
| --------- | ---------------- | ----------------------- |
| `kind`    | `"enumTypeNode"` | The node discriminator. |

### Children

| Attribute  | Type                                                                             | Description                                                                                                                                                                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variants` | [`EnumVariantTypeNode`](./EnumVariantTypeNode)[]                                 | All variants the node can represent.                                                                                                                                                                                                                                                                                                         |
| `size`     | [`NestedTypeNode`](./NestedTypeNode.md)<[`NumberTypeNode`](./NumberTypeNode.md)> | The size of the enum discriminator as a `NumberTypeNode`. This number will prepend the serialised enum variant in order to identify which variant was selected. By default, the index of the variant (starting at 0) is used as a variant discriminator. However, each variant can optionally provide their own custom discriminator number. |

## Functions

### `enumTypeNode(variants, options?)`

Helper function that creates a `EnumTypeNode` object from an array of `EnumVariantTypeNode` objects and an optional `size` attribute that can be passed in the `options` object as a second argument.

```ts
const node = enumTypeNode(variants);
const nodeWithU32Discriminator = enumTypeNode(variants, { size: numberTypeNode('u32') });
```

## Examples

### Enum with u8 discriminator

```ts
enumTypeNode([
    enumEmptyVariantTypeNode('flip'),
    enumTupleVariantTypeNode('rotate', tupleTypeNode([numberTypeNode('u32')])),
    enumStructVariantTypeNode(
        'move',
        structTypeNode([
            structFieldTypeNode({ name: 'x', type: numberTypeNode('u16') }),
            structFieldTypeNode({ name: 'y', type: numberTypeNode('u16') }),
        ]),
    ),
]);

// Flip                => 0x00
// Rotate (42)         => 0x012A000000
// Move { x: 1, y: 2 } => 0x0201000200
```
