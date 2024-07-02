# `IdentityValueNode`

A node that represents the main wallet that should **own things**.

For instance, in an web application, the identity would be the user's wallet; in a terminal, the identity would be the wallet identitied by `solana address`; etc.

Note that a similar node exists for representing the main wallet that should **pay for things** — the [`PayerValueNode`](./PayerValueNode.md). In practice, the identity and the payer are often the same but allowing the program maintainer to offer this distinction can be useful should they be different.

## Attributes

### Data

| Attribute | Type                  | Description             |
| --------- | --------------------- | ----------------------- |
| `kind`    | `"identityValueNode"` | The node discriminator. |

### Children

_This node has no children._

## Functions

### `identityValueNode()`

Helper function that creates a `IdentityValueNode` object.

```ts
const node = identityValueNode();
```

## Examples

### An instruction account defaulting to the identity value

```ts
instructionNode({
    name: 'transfer',
    accounts: [
        instructionAccountNode({
            name: 'authority',
            isSigner: true,
            isWritable: false,
            defaultValue: identityValueNode(),
        }),
        // ...
    ],
});
```
