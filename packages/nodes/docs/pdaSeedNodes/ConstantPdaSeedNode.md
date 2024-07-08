# `ConstantPdaSeedNode`

This node represents a constant seed for a program-derived address (PDA).

## Attributes

### Data

| Attribute | Type                    | Description             |
| --------- | ----------------------- | ----------------------- |
| `kind`    | `"constantPdaSeedNode"` | The node discriminator. |

### Children

| Attribute | Type                                                                                                            | Description                     |
| --------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `type`    | [`TypeNode`](../typeNodes/README.md)                                                                            | The type of the constant seed.  |
| `value`   | [`ValueNode`](../valueNodes/README.md) \| [`ProgramIdValueNode`](../contextualValueNodes/ProgramIdValueNode.md) | The value of the constant seed. |

## Functions

### `constantPdaSeedNode(type, value)`

Helper function that creates a `ConstantPdaSeedNode` object from a type node and a value node.

```ts
const node = constantPdaSeedNode(numberTypeNode('u32'), numberValueNode(42));
```

### `constantPdaSeedNodeFromString(encoding, data)`

Helper function that creates a `ConstantPdaSeedNode` object of type `StringTypeNode` from an encoding and a string of data.

```ts
constantPdaSeedNodeFromString('utf8', 'Hello');

// Equivalent to:
constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('Hello'));
```

### `constantValueNodeFromBytes(encoding, data)`

Helper function that creates a `ConstantValueNode` object of type `BytesTypeNode` from an encoding and a string of data.

```ts
constantValueNodeFromBytes('base16', 'FF99CC');

// Equivalent to:
constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'FF99CC'));
```

## Examples

### A PDA node with a UTF-8 constant seed

```ts
pdaNode({
    name: 'tickets',
    seeds: [constantPdaSeedNodeFromString('utf8', 'tickets')],
});
```
