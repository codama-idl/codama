# `EnumStructVariantTypeNode`

A node that defines an enum variant with a struct data type.

## Attributes

### Data

| Attribute       | Type                          | Description                                                                                                     |
| --------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `kind`          | `"enumStructVariantTypeNode"` | The node discriminator.                                                                                         |
| `name`          | `CamelCaseString`             | The name of the enum variant.                                                                                   |
| `discriminator` | `number`                      | (Optional) The variant's discriminator value. Defaults to the index of the variant in the enum (starting at 0). |

### Children

| Attribute | Type                                                                             | Description                           |
| --------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| `struct`  | [`NestedTypeNode`](./NestedTypeNode.md)<[`StructTypeNode`](./StructTypeNode.md)> | The struct data type for the variant. |

## Functions

### `enumStructVariantTypeNode(name, struct, discriminator?)`

Helper function that creates a `EnumStructVariantTypeNode` object from its name and data.

```ts
const node = enumStructVariantTypeNode(
    'coordinates',
    structTypeNode([
        structFieldTypeNode({ name: 'x', type: numberTypeNode('u32') }),
        structFieldTypeNode({ name: 'y', type: numberTypeNode('u32') }),
    ]),
);
```
