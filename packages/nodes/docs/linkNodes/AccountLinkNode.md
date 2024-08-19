# `AccountLinkNode`

This node represents a reference to an existing [`AccountNode`](../AccountNode.md) in the Kinobi IDL.

## Attributes

### Data

| Attribute | Type                | Description                                                             |
| --------- | ------------------- | ----------------------------------------------------------------------- |
| `kind`    | `"accountLinkNode"` | The node discriminator.                                                 |
| `name`    | `CamelCaseString`   | The name of the [`AccountNode`](../AccountNode.md) we are referring to. |

### Children

| Attribute | Type                                      | Description                                                                                                     |
| --------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `program` | [`ProgramLinkNode`](./ProgramLinkNode.md) | (Optional) The program associated with the linked account. Default to using the program we are currently under. |

## Functions

### `accountLinkNode(name, program?)`

Helper function that creates a `AccountLinkNode` object from the name of the `AccountNode` we are referring to. If the account is from another program, the `program` parameter must be provided as either a `string` or a `ProgramLinkNode`.

```ts
const node = accountLinkNode('myAccount');
const nodeFromAnotherProgram = accountLinkNode('myAccount', 'myOtherProgram');
```
