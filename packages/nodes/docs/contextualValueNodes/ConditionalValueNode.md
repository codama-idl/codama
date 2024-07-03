# `ConditionalValueNode`

A value node that differs based on a condition.

## Attributes

### Data

| Attribute | Type                     | Description             |
| --------- | ------------------------ | ----------------------- |
| `kind`    | `"conditionalValueNode"` | The node discriminator. |

### Children

| Attribute   | Type                                                                                                                                          | Description                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `condition` | [`AccountValueNode`](./AccountValueNode.md) \| [`ArgumentValueNode`](./ArgumentValueNode.md) \| [`ResolverValueNode`](./ResolverValueNode.md) | The condition that must be met. If it is an argument or value node, the `value` attribute may be used to assert on a specific value. |
| `value`     | [`ValueNode`](../valueNodes/README.md)                                                                                                        | (Optional) If provided, the `condition` must be equal to this value. Otherwise, the `condition` must simply exist.                   |
| `ifTrue`    | [`InstructionInputValueNode`](./InstructionInputValueNode.md)                                                                                 | (Optional) The value to use if the condition is true.                                                                                |
| `ifFalse`   | [`InstructionInputValueNode`](./InstructionInputValueNode.md)                                                                                 | (Optional) The value to use if the condition is false.                                                                               |

## Functions

### `conditionalValueNode(input)`

Helper function that creates a `ConditionalValueNode` object from an input object.

```ts
const node = conditionalValueNode({
    condition: argumentValueNode('amount'),
    value: numberValueNode(0),
    ifTrue: accountValueNode('mint'),
    ifFalse: programIdValueNode(),
});
```

## Examples

### An instruction account that defaults to another account if a condition is met

```ts
instructionNode({
    name: 'transfer',
    accounts: [
        instructionAccountNode({
            name: 'source',
            isSigner: false,
            isWritable: true,
        }),
        instructionAccountNode({
            name: 'destination',
            isSigner: false,
            isWritable: true,
            isOptional: true,
            defaultValue: conditionalValueNode({
                condition: argumentValueNode('amount'),
                value: numberValueNode(0),
                ifTrue: accountValueNode('source'),
            }),
        }),
        // ...
    ],
    arguments: [
        instructionArgumentNode({
            name: 'amount',
            type: numberTypeNode('u64'),
        }),
    ],
});
```
