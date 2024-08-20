# `PdaLinkNode`

This node represents a reference to an existing [`PdaNode`](../PdaNode.md) in the Kinobi IDL.

## Attributes

### Data

| Attribute | Type              | Description                                                     |
| --------- | ----------------- | --------------------------------------------------------------- |
| `kind`    | `"pdaLinkNode"`   | The node discriminator.                                         |
| `name`    | `CamelCaseString` | The name of the [`PdaNode`](../PdaNode.md) we are referring to. |

### Children

| Attribute | Type                                      | Description                                                                                                 |
| --------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `program` | [`ProgramLinkNode`](./ProgramLinkNode.md) | (Optional) The program associated with the linked PDA. Default to using the program we are currently under. |

## Functions

### `pdaLinkNode(name, program?)`

Helper function that creates a `PdaLinkNode` object from the name of the `PdaNode` we are referring to. If the PDA is from another program, the `program` parameter must be provided as either a `string` or a `ProgramLinkNode`.

```ts
const node = pdaLinkNode('myPda');
const nodeFromAnotherProgram = pdaLinkNode('myPda', 'myOtherProgram');
```
