# `DiscriminatorNode` (abstract)

The `DiscriminatorNode` type helper represents all available strategies that help distinguish blocks of data — such as accounts and instructions. Note that `DiscriminatorNode` is a type alias and cannot be used directly as a node. Instead you may use one of the following nodes:

- [`ConstantDiscriminatorNode`](./ConstantDiscriminatorNode.md)
- [`FieldDiscriminatorNode`](./FieldDiscriminatorNode.md)
- [`SizeDiscriminatorNode`](./SizeDiscriminatorNode.md)
