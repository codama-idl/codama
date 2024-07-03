# `InstructionRemainingAccountsNode`

This node represents a list of remaining accounts for an instruction. It can be used to represent a dynamic list of accounts that are not explicitly defined in the instruction but may be required for the instruction to execute.

## Attributes

### Data

| Attribute    | Type                                 | Description                                                                                                                                                                   |
| ------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`       | `"instructionRemainingAccountsNode"` | The node discriminator.                                                                                                                                                       |
| `docs`       | `string[]`                           | Markdown documentation explaining the remaining accounts of an instruction.                                                                                                   |
| `isOptional` | `boolean`                            | (Optional) Whether the remaining accounts are optional. Defaults to `false`.                                                                                                  |
| `isSigner`   | `boolean` \| `"either"`              | (Optional) Whether the remaining accounts are signers. If `true`, all are. If `false`, none are. If `"either"`, they may each either be a signer or not. Defaults to `false`. |

### Children

| Attribute | Type                                                                                                                                     | Description                                                                                                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`   | [`ArgumentValueNode`](./contextualValueNodes/ArgumentValueNode.md) \| [`ResolverValueNode`](./contextualValueNodes/ResolverValueNode.md) | The node representing how these remaining accounts are gathered. If a `ArgumentValueNode` is provided, a new argument will be used to represent this array of accounts from the provided name. Otherwise, a `ResolverValueNode` can be used as a fallback to represent more complex scenarios. |

## Functions

### `instructionRemainingAccountsNode(value, options?)`

Helper function that creates a `InstructionRemainingAccountsNode` object from a value node and some options.

```ts
const node = instructionRemainingAccountsNode(argumentValueNode('signers'), {
    isSigner: true,
    isOptional: true,
});
```

## Examples

### Optional remaining signers

```ts
instructionRemainingAccountsNode(argumentValueNode('authorities'), {
    isSigner: true,
    isOptional: true,
});
```

### Remaining accounts that may or may not be signers

```ts
instructionRemainingAccountsNode(argumentValueNode('authorities'), {
    isSigner: 'either',
});
```

### Remaining accounts using a resolver

```ts
instructionRemainingAccountsNode(
    resolverValueNode('resolveTransferRemainingAccounts', {
        docs: ['Provide authorities as remaining accounts if and only if the asset has a multisig set up.'],
        dependsOn: [argumentValueNode('hasMultisig'), argumentValueNode('authorities')],
    }),
);
```
