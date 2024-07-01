# `EnumValueNode`

A node representing a value of an enum type. That is, it selects a specific variant and optionally provides the data associated with that variant.

## Attributes

### Data

| Attribute | Type              | Description                        |
| --------- | ----------------- | ---------------------------------- |
| `kind`    | `"enumValueNode"` | The node discriminator.            |
| `variant` | `CamelCaseString` | The name of the variant to select. |

### Children

| Attribute | Type                                                                                 | Description                                                                                        |
| --------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `enum`    | [`DefinedTypeLinkNode`](./typeNodes/DefinedTypeLinkNode.md)                          | The linked enum type definition. The `DefinedTypeNode` it links to must contain an `EnumTypeNode`. |
| `value`   | [`StructValueNode`](./StructValueNode.md) \| [`TupleValueNode`](./TupleValueNode.md) | (Optional) The data of the enum variant if required.                                               |

## Functions

### `enumValueNode(enum, variant, value?)`

Helper function that creates a `EnumValueNode` object from an enum type, a variant name, and an optional value node for its data. The first argument can be a `DefinedTypeLinkNode` or a `string` matching the name of the defined enum type.

```ts
const node = enumValueNode('myEnum', 'myVariant');
const nodeWithExplicitEnum = enumValueNode(definedTypeLinkNode('myEnum'), 'myVariant');

const nodeWithData = enumValueNode(
    'myEnum',
    'myVariantWithData',
    structValueNode([
        structFieldValueNode('name', stringValueNode('Alice')),
        structFieldValueNode('age', numberValueNode(42)),
    ]),
);
```
