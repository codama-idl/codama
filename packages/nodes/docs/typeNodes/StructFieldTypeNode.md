# `StructFieldTypeNode`

A node that describes a field in a object or struct. It contains a name, a type, and optionally a default value.

## Attributes

### Data

| Attribute              | Type                      | Description                                                            |
| ---------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `kind`                 | `"structFieldTypeNode"`   | The node discriminator.                                                |
| `name`                 | `CamelCaseString`         | The name of the field.                                                 |
| `docs`                 | `string[]`                | Markdown documentation for the type.                                   |
| `defaultValueStrategy` | `"omitted" \| "optional"` | (Optional) The strategy to use for the default value node if provided. |

### Children

| Attribute      | Type                                   | Description                                |
| -------------- | -------------------------------------- | ------------------------------------------ |
| `type`         | [`TypeNode`](./README.md)              | The data type of the field.                |
| `defaultValue` | [`ValueNode`](../valueNodes/README.md) | (Optional) The default value of the field. |

## Functions

### `structFieldTypeNode(input)`

Helper function that creates a `StructFieldTypeNode` object from an input object.

```ts
const authorityField = structFieldTypeNode({
    name: 'authority',
    type: publicKeyTypeNode(),
});

const ageFieldWithDefaultValue = structFieldTypeNode({
    name: 'age',
    type: numberTypeNode('u8'),
    defaultValue: numberValueNode(42),
});
```

## Examples

### A struct field with a default value

```ts
structFieldTypeNode({
    name: 'age',
    type: numberTypeNode('u8'),
    defaultValue: numberValueNode(42),
});

// {}          => 0x2A
// { age: 29 } => 0x1D
```
