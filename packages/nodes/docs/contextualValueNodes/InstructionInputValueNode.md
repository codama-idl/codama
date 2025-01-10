# `InstructionInputValueNode` (abstract)

The `InstructionInputValueNode` type helper represents all values that can be used as a default value for an instruction account or an instruction argument. Note that `InstructionInputValueNode` is a type alias and cannot be used directly as a node. Instead you may use one of the following nodes:

- [`ContextualValueNode`](./README.md) (abstract)
- [`ProgramLinkNode`](../linkNodes/ProgramLinkNode.md)
- [`ValueNode`](../valueNodes/README.md) (abstract)
