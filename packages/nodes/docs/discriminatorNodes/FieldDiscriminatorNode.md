# `FieldDiscriminatorNode`

This node represents a byte discrimination strategy where the data is **identified by the default value of a struct field** at a given offset. Discriminator nodes are used to distinguish between different types of accounts or instructions in a program.

## Attributes

### Data

| Attribute | Type                       | Description                                                                                                      |
| --------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `kind`    | `"fieldDiscriminatorNode"` | The node discriminator.                                                                                          |
| `field`   | `CamelCaseString`          | The name of the [`StructFieldTypeNode`](../typeNodes/StructFieldTypeNode.md) we should use to identify the data. |
| `offset`  | `number`                   | The byte at which the field should be located.                                                                   |

### Children

_This node has no children._

## Functions

### `fieldDiscriminatorNode(field, offset?)`

Helper function that creates a `FieldDiscriminatorNode` object from a field name and an optional offset.

```ts
const node = fieldDiscriminatorNode('accountState', 64);
```

## Examples

### An account distinguished by a u32 field at offset 0

```ts
accountNode({
    data: structTypeNode([
        structFieldTypeNode({
            name: 'discriminator',
            type: numberTypeNode('u32'),
            defaultValue: numberValueNode(42),
            defaultValueStrategy: 'omitted',
        }),
        // ...
    ]),
    discriminators: [fieldDiscriminatorNode('discriminator')],
    // ...
});
```

### An instruction disctinguished by an 8-byte argument at offset 0

```ts
instructionNode({
    arguments: [
        instructionArgumentNode({
            name: 'discriminator',
            type: fixedSizeTypeNode(bytesTypeNode(), 8),
            defaultValue: bytesValueNode('base16', '0011223344556677'),
            defaultValueStrategy: 'omitted',
        }),
        // ...
    ],
    discriminators: [fieldDiscriminatorNode('discriminator')],
    // ...
});
```
