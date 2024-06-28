# `EnumEmptyVariantTypeNode`

A node that defines an enum variant with no data.

## Attributes

### Data

| Attribute       | Type                         | Description                                                                                                     |
| --------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `kind`          | `"enumEmptyVariantTypeNode"` | The node discriminator.                                                                                         |
| `name`          | `CamelCaseString`            | The name of the enum variant.                                                                                   |
| `discriminator` | `number`                     | (Optional) The variant's discriminator value. Defaults to the index of the variant in the enum (starting at 0). |

### Children

_This node has no children._

## Functions

### `enumEmptyVariantTypeNode(name)`

Helper function that creates a `EnumEmptyVariantTypeNode` object from its name.

```ts
const node = enumEmptyVariantTypeNode('myVariantName');
```
