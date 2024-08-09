# `ConstantValueNode`

A node that represents a constant value from a [`TypeNode`](../typeNodes/README.md) and a [`ValueNode`](./README.md).

## Attributes

### Data

| Attribute | Type                  | Description             |
| --------- | --------------------- | ----------------------- |
| `kind`    | `"constantValueNode"` | The node discriminator. |

### Children

| Attribute | Type                                 | Description                |
| --------- | ------------------------------------ | -------------------------- |
| `type`    | [`TypeNode`](../typeNodes/README.md) | The type of the constant.  |
| `value`   | [`ValueNode`](./README.md)           | The value of the constant. |

## Functions

### `constantValueNode(type, value)`

Helper function that creates a `ConstantValueNode` object from a type and a value node

```ts
const node = constantValueNode(numberTypeNode('u32'), numberValueNode(42));
```

### `constantValueNodeFromString(encoding, data)`

Helper function that creates a `ConstantValueNode` object of type `StringTypeNode` from an encoding and a string of data.

```ts
constantValueNodeFromString('utf8', 'Hello');

// Equivalent to:
constantValueNode(stringTypeNode('utf8'), stringValueNode('Hello'));
```

### `constantValueNodeFromBytes(encoding, data)`

Helper function that creates a `ConstantValueNode` object of type `BytesTypeNode` from an encoding and a string of data.

```ts
constantValueNodeFromBytes('base16', 'FF99CC');

// Equivalent to:
constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'FF99CC'));
```
