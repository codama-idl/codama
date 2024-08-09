# `ArgumentValueNode`

A node that refers to an argument — e.g. an instruction argument in the context of an instruction.

## Attributes

### Data

| Attribute | Type                  | Description               |
| --------- | --------------------- | ------------------------- |
| `kind`    | `"argumentValueNode"` | The node discriminator.   |
| `name`    | `CamelCaseString`     | The name of the argument. |

### Children

_This node has no children._

## Functions

### `argumentValueNode(name)`

Helper function that creates a `ArgumentValueNode` object from the argument name.

```ts
const node = argumentValueNode('amount');
```

## Examples

### An instruction argument defaulting to another argument

```ts
instructionNode({
    name: 'mint',
    arguments: [
        instructionArgumentNode({
            name: 'amount',
            type: numberTypeNode('u64'),
        }),
        instructionArgumentNode({
            name: 'amountToDelegate',
            type: numberTypeNode('u64'),
            defaultValue: argumentValueNode('amount'),
        }),
        // ...
    ],
});
```
