# Constant Node

The `ConstantNode` represents a program constant with a name, type, and value. Constants are immutable values defined at the program level.

## Attributes

### Data

| Attribute | Type              | Description                              |
| --------- | ----------------- | ---------------------------------------- |
| `kind`    | `"constantNode"`  | The node discriminator                   |
| `name`    | `CamelCaseString` | The name of the constant                 |
| `docs`    | `Docs` (optional) | Markdown documentation for this constant |

### Children

| Attribute | Type        | Description                    |
| --------- | ----------- | ------------------------------ |
| `type`    | `TypeNode`  | The type of the constant value |
| `value`   | `ValueNode` | The constant value             |

## Functions

### `constantNode(name, type, value)`

Helper function that creates a `ConstantNode` object from its attributes.

```ts
const node = constantNode('maxSize', numberTypeNode('u64'), numberValueNode(1000));
```

## Examples

### Numeric Constant

```ts
const maxSize = constantNode('MAX_SIZE', numberTypeNode('u32'), numberValueNode(100));
```

### Bytes Constant

```ts
const seedPrefix = constantNode('SEED_PREFIX', bytesTypeNode(), bytesValueNode('base16', '74657374'));
```

### With Documentation

```ts
const maxItems = constantNode('MAX_ITEMS', numberTypeNode('u64'), numberValueNode(1000));
// Note: Add docs via the ConstantNode interface if needed
```

## Parsing from Anchor IDL

When parsing from Anchor IDL, constants are automatically converted to `ConstantNode` instances. The Anchor IDL represents constants with the following structure:

```json
{
    "name": "MAX_SIZE",
    "type": "u64",
    "value": "1000"
}
```

This gets parsed into:

```ts
constantNode(
    'maxSize', // Name is converted to camelCase
    numberTypeNode('u64'),
    numberValueNode(1000),
);
```

### Byte Array Constants

Byte arrays in the IDL are represented as JSON arrays:

```json
{
    "name": "SEED_PREFIX",
    "type": "bytes",
    "value": "[116, 101, 115, 116]"
}
```

This is parsed as:

```ts
constantNode(
    'seedPrefix',
    bytesTypeNode(),
    bytesValueNode('base16', '74657374'), // hex representation
);
```
