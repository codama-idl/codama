# `VariablePdaSeedNode`

This node represents a variable seed for a program-derived address (PDA). It is characterized by a name and a type.

## Attributes

### Data

| Attribute | Type                    | Description                                   |
| --------- | ----------------------- | --------------------------------------------- |
| `kind`    | `"variablePdaSeedNode"` | The node discriminator.                       |
| `name`    | `CamelCaseString`       | The name of the variable seed.                |
| `docs`    | `string[]`              | Markdown documentation for the variable seed. |

### Children

| Attribute | Type                                 | Description                    |
| --------- | ------------------------------------ | ------------------------------ |
| `type`    | [`TypeNode`](../typeNodes/README.md) | The type of the variable seed. |

## Functions

### `variablePdaSeedNode(name, type, docs?)`

Helper function that creates a `VariablePdaSeedNode` object from a name, a type node and optional documentation.

```ts
const node = variablePdaSeedNode('amount', numberTypeNode('u32'));
```

## Examples

### A PDA node with a public key variable seed

```ts
pdaNode({
    name: 'ticket',
    seeds: [variablePdaSeedNode('authority', publicKeyTypeNode())],
});
```
