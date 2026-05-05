# `ConstantNode`

This node represents a program-level constant with a name, type, and value.

## Attributes

### Data

| Attribute | Type              | Description                              |
| --------- | ----------------- | ---------------------------------------- |
| `kind`    | `"constantNode"`  | The node discriminator.                  |
| `name`    | `CamelCaseString` | The name of the constant.                |
| `docs`    | `string[]`        | Markdown documentation for the constant. |

### Children

| Attribute | Type                                  | Description                     |
| --------- | ------------------------------------- | ------------------------------- |
| `type`    | [`TypeNode`](./typeNodes/README.md)   | The type of the constant value. |
| `value`   | [`ValueNode`](./valueNodes/README.md) | The constant value.             |

## Functions

### `constantNode(name, type, value, docs?)`

Helper function that creates a `ConstantNode` object from its attributes.

```ts
const node = constantNode('maxSize', numberTypeNode('u64'), numberValueNode(1000));
```

## Examples

### Numeric Constant

```ts
const node = constantNode('maxSize', numberTypeNode('u32'), numberValueNode(100));
```

### Bytes Constant

```ts
const node = constantNode('seedPrefix', bytesTypeNode(), bytesValueNode('base16', '74657374'));
```

### With Documentation

```ts
const node = constantNode('maxItems', numberTypeNode('u64'), numberValueNode(1000), [
    'The maximum number of items allowed.',
]);
```
