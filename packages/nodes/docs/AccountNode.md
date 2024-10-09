# `AccountNode`

This node defines an on-chain account. It is characterized by its name, data structure, and optional attributes such as PDA definition and account discriminators.

![Diagram](https://github.com/codama-idl/codama/assets/3642397/77974dad-212e-49b1-8e41-5d466c273a02)

## Attributes

### Data

| Attribute | Type              | Description                                                                         |
| --------- | ----------------- | ----------------------------------------------------------------------------------- |
| `kind`    | `"accountNode"`   | The node discriminator.                                                             |
| `name`    | `CamelCaseString` | The name of the account.                                                            |
| `docs`    | `string[]`        | Markdown documentation for the account.                                             |
| `size`    | `number`          | (Optional) The size of the account in bytes, if the account's data length is fixed. |

### Children

| Attribute        | Type                                                                                                 | Description                                                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data`           | [`NestedTypeNode`](./typeNodes/NestedTypeNode.md)<[`StructTypeNode`](./typeNodes/StructTypeNode.md)> | The type node that describes the account's data. Note that it must be a struct so we can access its fields via other nodes.                                              |
| `pda`            | [`PdaLinkNode`](./linkNodes/PdaLinkNode.md)                                                          | (Optional) The link node that describes the account's PDA, if its address is derived from one.                                                                           |
| `discriminators` | [`DiscriminatorNode`](./discriminatorNodes/README.md)[]                                              | (Optional) The nodes that distinguish this account from others in the program. If multiple discriminators are provided, they are combined using a logical AND operation. |

## Functions

### `accountNode(input)`

Helper function that creates a `AccountNode` object from an input object.

```ts
const node = accountNode({
    name: 'myCounter',
    data: structTypeNode([
        structFieldTypeNode({ name: 'authority', type: publicKeyTypeNode() }),
        structFieldTypeNode({ name: 'value', type: numberTypeNode('u64') }),
    ]),
});
```

## Examples

### A fixed-size account

```ts
const node = accountNode({
    name: 'token',
    data: structTypeNode([
        structFieldTypeNode({ name: 'mint', type: publicKeyTypeNode() }),
        structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() }),
        structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') }),
    ]),
    discriminators: [sizeDiscriminatorNode(72)],
    size: 72,
});
```

### An account with a linked PDA

```ts
programNode({
    name: 'myProgram',
    accounts: [
        accountNode({
            name: 'token',
            data: structTypeNode([structFieldTypeNode({ name: 'authority', type: publicKeyTypeNode() })]),
            pda: pdaLinkNode('myPda'),
        }),
    ],
    pdas: [
        pdaNode({
            name: 'myPda',
            seeds: [
                constantPdaSeedNodeFromString('utf8', 'token'),
                variablePdaSeedNode('authority', publicKeyTypeNode()),
            ],
        }),
    ],
});
```
