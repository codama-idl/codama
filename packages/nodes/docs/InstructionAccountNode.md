# `InstructionAccountNode`

This node defines an account used by an instruction. It is characterized by its name and various requirements such as whether it needs to be writable or a signer.

![Diagram](https://github.com/kinobi-so/kinobi/assets/3642397/4656a08b-2f89-49c2-b428-5378cb1a0b9e)

## Attributes

### Data

| Attribute    | Type                       | Description                                                                                                                                                                                                                                            |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `kind`       | `"instructionAccountNode"` | The node discriminator.                                                                                                                                                                                                                                |
| `name`       | `CamelCaseString`          | The name of the instruction account.                                                                                                                                                                                                                   |
| `isWritable` | `boolean`                  | Whether of not the account needs to be writable.                                                                                                                                                                                                       |
| `isSigner`   | `boolean` \| `"either"`    | Whether or not the account needs to be a signer. If the value `"either"` is provided, the account can be either a signer or not depending on the context.                                                                                              |
| `isOptional` | `boolean`                  | (Optional) Whether or not the account is optional. If this is `true`, the account should be handled as an optional account according to the `optionalAccountStrategy` attribute of the [`InstructionNode`.](./InstructionNode.md) Defaults to `false`. |
| `docs`       | `string[]`                 | Markdown documentation for the type.                                                                                                                                                                                                                   |

### Children

| Attribute      | Type                                                                               | Description                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `defaultValue` | [`InstructionInputValueNode`](./contextualValueNodes/InstructionInputValueNode.md) | (Optional) A default value for the account should this account not be provided when constructing the instruction. |

## Functions

### `instructionAccountNode(input)`

Helper function that creates a `InstructionAccountNode` object from an input object.

```ts
const node = instructionAccountNode({
    name: 'authority',
    isWritable: false,
    isSigner: true,
    docs: ['This account that has the authority to perform this instruction.'],
});
```

## Examples

### An optional account

```ts
instructionAccountNode({
    name: 'freezeAuthority',
    isWritable: false,
    isSigner: false,
    isOptional: true,
    docs: ['The freeze authority to set on the asset, if any.'],
});
```

### An optional signer account

```ts
instructionAccountNode({
    name: 'owner',
    isWritable: true,
    isSigner: 'either',
    docs: ['The owner of the asset. The owner must only sign the transaction if the asset is being updated.'],
});
```
