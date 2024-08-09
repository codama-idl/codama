# `ConstantDiscriminatorNode`

This node represents a byte discrimination strategy where the data is **identified by a constant value** at a given offset. Discriminator nodes are used to distinguish between different types of accounts or instructions in a program.

## Attributes

### Data

| Attribute | Type                          | Description                                       |
| --------- | ----------------------------- | ------------------------------------------------- |
| `kind`    | `"constantDiscriminatorNode"` | The node discriminator.                           |
| `offset`  | `number`                      | The byte at which the constant should be located. |

### Children

| Attribute  | Type                                                     | Description                                  |
| ---------- | -------------------------------------------------------- | -------------------------------------------- |
| `constant` | [`ConstantValueNode`](./valueNodes/ConstantValueNode.md) | The constant value that identifies the data. |

## Functions

### `constantDiscriminatorNode(constant, offset?)`

Helper function that creates a `ConstantDiscriminatorNode` object from a constant value node and an optional offset.

```ts
const node = constantDiscriminatorNode(constantValueNodeFromString('utf8', 'Hello'), 64);
```

## Examples

### An account distinguished by a u32 number equal to 42 at offset 0

```ts
accountNode({
    discriminators: [constantDiscriminatorNode(constantValueNode(numberTypeNode('u32'), numberValueNode(42)))],
    // ...
});
```

### An instruction disctinguished by an 8-byte hash at offset 0

```ts
instructionNode({
    discriminators: [constantValueNodeFromBytes('base16', '0011223344556677')],
    // ...
});
```
