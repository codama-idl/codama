# `SizeDiscriminatorNode`

This node represents a byte discrimination strategy where the data is **identified by being equal to a given size**. Discriminator nodes are used to distinguish between different types of accounts or instructions in a program.

## Attributes

### Data

| Attribute | Type                      | Description                        |
| --------- | ------------------------- | ---------------------------------- |
| `kind`    | `"sizeDiscriminatorNode"` | The node discriminator.            |
| `size`    | `number`                  | The size that identifies the data. |

### Children

_This node has no children._

## Functions

### `sizeDiscriminatorNode(size)`

Helper function that creates a `SizeDiscriminatorNode` object from a size.

```ts
const node = sizeDiscriminatorNode(165);
```

## Examples

### An account distinguished by its size being equal to 42

```ts
accountNode({
    discriminators: [sizeDiscriminatorNode(42)],
    // ...
});
```

### An instruction disctinguished by its size being equal to 42

```ts
instructionNode({
    discriminators: [sizeDiscriminatorNode(42)],
    // ...
});
```
