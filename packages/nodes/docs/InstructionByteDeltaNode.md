# `InstructionByteDeltaNode`

This node represents a difference in bytes stored on-chain from executing an instruction. For instance, if an instruction creates a new account of 42 bytes, this node can provide this information. This enables clients to allocate the right amount of lamports to cover the cost of executing the instruction.

## Attributes

### Data

| Attribute    | Type                         | Description                                                                                                                                                                       |
| ------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`       | `"instructionByteDeltaNode"` | The node discriminator.                                                                                                                                                           |
| `withHeader` | `boolean`                    | (Optional) Whether or not we should add the account header size — i.e. 128 bytes — to the value. Default to `false` when the value is a `ResolverValueNode` and `true` otherwise. |
| `subtract`   | `boolean`                    | (Optional) Whether or not the provided value should be subtracted from the total byte delta. Defaults to `false`.                                                                 |

### Children

| Attribute | Type                                                                                                                                                                                                                                                    | Description                                                                                                                                                                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`   | [`AccountLinkNode`](./linkNodes/AccountLinkNode.md) \| [`ArgumentValueNode`](./contextualValueNodes/ArgumentValueNode.md) \| [`NumberValueNode`](./valueNodes/NumberValueNode.md) \| [`ResolverValueNode`](./contextualValueNodes/ResolverValueNode.md) | The value representing the byte delta. If an `AccountLinkNode` is used, the size of the linked account will be used. If an `ArgumentValueNode` is used, the value of the instruction argument will be used. If a `NumberValueNode` is used, that explicit number will be used. Otherwise, a `ResolverValueNode` can be used as a fallback for more complex values. |

## Functions

### `instructionByteDeltaNode(value, options?)`

Helper function that creates a `InstructionByteDeltaNode` object from a value node and some options.

```ts
const node = instructionByteDeltaNode(numberValueNode(42), { withHeader: false });
```

## Examples

### A byte delta that represents a new account

```ts
instructionByteDeltaNode(accountLinkNode('token'));
```

### A byte delta that represents an account deletion

```ts
instructionByteDeltaNode(accountLinkNode('token'), { subtract: true });
```

### A byte delta that uses an argument value to increase the space of an account

```ts
instructionByteDeltaNode(argumentValueNode('additionalSpace'), { withHeader: false });
```
