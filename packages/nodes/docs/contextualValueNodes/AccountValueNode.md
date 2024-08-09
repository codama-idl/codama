# `AccountValueNode`

A node that refers to an account — e.g. an instruction account in the context of an instruction.

## Attributes

### Data

| Attribute | Type                 | Description              |
| --------- | -------------------- | ------------------------ |
| `kind`    | `"accountValueNode"` | The node discriminator.  |
| `name`    | `CamelCaseString`    | The name of the account. |

### Children

_This node has no children._

## Functions

### `accountValueNode(name)`

Helper function that creates a `AccountValueNode` object from the account name.

```ts
const node = accountValueNode('mint');
```

## Examples

### An instruction account defaulting to another account

```ts
instructionNode({
    name: 'mint',
    accounts: [
        instructionAccountNode({
            name: 'payer',
            isSigner: true,
            isWritable: false,
        }),
        instructionAccountNode({
            name: 'authority',
            isSigner: false,
            isWritable: true,
            defaultValue: accountValueNode('payer'),
        }),
        // ...
    ],
});
```
