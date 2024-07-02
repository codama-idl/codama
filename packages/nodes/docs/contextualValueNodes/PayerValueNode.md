# `PayerValueNode`

A node that represents the main wallet that should **pay for things**.

For instance, in an web application, the payer would be the user's wallet; in a terminal, the payer would be the wallet identitied by `solana address`; etc.

Note that a similar node exists for representing the main wallet that should **own things** — the [`IdentityValueNode`](./IdentityValueNode.md). In practice, the payer and the identity are often the same but allowing the program maintainer to offer this distinction can be useful should they be different.

## Attributes

### Data

| Attribute | Type               | Description             |
| --------- | ------------------ | ----------------------- |
| `kind`    | `"payerValueNode"` | The node discriminator. |

### Children

_This node has no children._

## Functions

### `payerValueNode()`

Helper function that creates a `PayerValueNode` object.

```ts
const node = payerValueNode();
```

## Examples

### An instruction account defaulting to the payer value

```ts
instructionNode({
    name: 'transfer',
    accounts: [
        instructionAccountNode({
            name: 'payer',
            isSigner: true,
            isWritable: false,
            defaultValue: payerValueNode(),
        }),
        // ...
    ],
});
```
