# `EnumTupleVariantTypeNode`

A node that defines an enum variant with a tuple data type.

## Attributes

### Data

| Attribute       | Type                         | Description                                                                                                     |
| --------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `kind`          | `"enumTupleVariantTypeNode"` | The node discriminator.                                                                                         |
| `name`          | `CamelCaseString`            | The name of the enum variant.                                                                                   |
| `discriminator` | `number`                     | (Optional) The variant's discriminator value. Defaults to the index of the variant in the enum (starting at 0). |

### Children

| Attribute | Type                                                                           | Description                          |
| --------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| `tuple`   | [`NestedTypeNode`](./NestedTypeNode.md)<[`TupleTypeNode`](./TupleTypeNode.md)> | The tuple data type for the variant. |

## Functions

### `enumTupleVariantTypeNode(name, tuple, discriminator?)`

Helper function that creates a `EnumTupleVariantTypeNode` object from its name and data.

```ts
const node = enumTupleVariantTypeNode('coordinates', tupleTypeNode([numberTypeNode('u32'), numberTypeNode('u32')]));
```
