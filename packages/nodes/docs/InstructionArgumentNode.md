# `InstructionArgumentNode`

This node defines an argument that is passed to an instruction. When all arguments are combined and serialized next to each other, they form the instruction's data.

![Diagram](https://github.com/codama-idl/codama/assets/3642397/7e2def82-949a-4663-bdc3-ac599d39d2d2)

## Attributes

### Data

| Attribute              | Type                        | Description                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`                 | `"instructionArgumentNode"` | The node discriminator.                                                                                                                                                                                                                                                                                                            |
| `name`                 | `CamelCaseString`           | The name of the instruction argument.                                                                                                                                                                                                                                                                                              |
| `docs`                 | `string[]`                  | Markdown documentation for the instruction argument.                                                                                                                                                                                                                                                                               |
| `defaultValueStrategy` | `"optional"` \| `"omitted"` | (Optional) The strategy to use when a default value is provided for the argument. `"optional"` means that the argument's default value may be overriden by a provided argument, while `"omitted"` means that no argument should be provided and the default value should always be the argument's value. Defaults to `"optional"`. |

### Children

| Attribute      | Type                                                                               | Description                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `type`         | [`TypeNode`](./typeNodes/README.md)                                                | The `TypeNode` that describes the argument's data.                                                                  |
| `defaultValue` | [`InstructionInputValueNode`](./contextualValueNodes/InstructionInputValueNode.md) | (Optional) A default value for the argument should this argument not be provided when constructing the instruction. |

## Functions

### `instructionArgumentNode(input)`

Helper function that creates a `InstructionArgumentNode` object from an input object.

```ts
const node = instructionArgumentNode({
    name: 'amount',
    type: numberTypeNode('u64'),
    docs: ['This amount of tokens to transfer.'],
});
```

## Examples

### An argument with a default value

```ts
instructionArgumentNode({
    name: 'amount',
    type: numberTypeNode('u64'),
    defaultValue: numberValueNode(0),
});
```

### An argument with an omitted default value

```ts
instructionArgumentNode({
    name: 'instructionDiscriminator',
    type: numberTypeNode('u8'),
    defaultValue: numberValueNode(42),
    defaultValueStrategy: 'omitted',
});
```
