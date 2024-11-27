# Codama ➤ Nodes

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/nodes.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/nodes.svg?style=flat&label=%40codama%2Fnodes
[npm-url]: https://www.npmjs.com/package/@codama/nodes

This package defines the various nodes that make up the Codama IDL. It provides types and helper functions to work with these nodes. If you are looking for a type-only version of these nodes, you can find them in the [`@codama/node-types`](../node-types) package.

## Installation

```sh
pnpm install @codama/nodes
```

> [!NOTE]
> This package is included in the main [`codama`](../library) package. Meaning, you already have access to its content if you are installing Codama this way.
>
> ```sh
> pnpm install codama
> ```

## All available nodes

The Codama IDL is composed of various nodes that describe different aspects of a Solana program. Some nodes are categorised together as they share a similar purpose. For instance, all the nodes that describe a data structure that can be encoded and decoded into buffers are grouped under the `TypeNode` category.

Below are all of the available nodes and their documentation. Also note that you can refer to any node using the [`Node`](./docs/README.md) helper type.

- [`AccountNode`](./docs/AccountNode.md)
- [`DefinedTypeNode`](./docs/DefinedTypeNode.md)
- [`ErrorNode`](./docs/ErrorNode.md)
- [`InstructionAccountNode`](./docs/InstructionAccountNode.md)
- [`InstructionArgumentNode`](./docs/InstructionArgumentNode.md)
- [`InstructionByteDeltaNode`](./docs/InstructionByteDeltaNode.md)
- [`InstructionNode`](./docs/InstructionNode.md)
- [`InstructionRemainingAccountsNode`](./docs/InstructionRemainingAccountsNode.md)
- [`PdaNode`](./docs/PdaNode.md)
- [`ProgramNode`](./docs/ProgramNode.md)
- [`RootNode`](./docs/RootNode.md)
- [`ContextualValueNode`](./docs/contextualValueNodes/README.md) (abstract)
    - [`AccountBumpValueNode`](./docs/contextualValueNodes/AccountBumpValueNode.md)
    - [`AccountValueNode`](./docs/contextualValueNodes/AccountValueNode.md)
    - [`ArgumentValueNode`](./docs/contextualValueNodes/ArgumentValueNode.md)
    - [`ConditionalValueNode`](./docs/contextualValueNodes/ConditionalValueNode.md)
    - [`IdentityValueNode`](./docs/contextualValueNodes/IdentityValueNode.md)
    - [`PayerValueNode`](./docs/contextualValueNodes/PayerValueNode.md)
    - [`PdaSeedValueNode`](./docs/contextualValueNodes/PdaSeedValueNode.md)
    - [`PdaValueNode`](./docs/contextualValueNodes/PdaValueNode.md)
    - [`ProgramIdValueNode`](./docs/contextualValueNodes/ProgramIdValueNode.md)
    - [`ResolverValueNode`](./docs/contextualValueNodes/ResolverValueNodemds)
- [`CountNode`](./docs/countNodes/README.md) (abstract)
    - [`FixedCountNode`](./docs/countNodes/FixedCountNode.md)
    - [`PrefixedCountNode`](./docs/countNodes/PrefixedCountNode.md)
    - [`RemainderCountNode`](./docs/countNodes/RemainderCountNodemds)
- [`DiscriminatorNode`](./docs/discriminatorNodes/README.md) (abstract)
    - [`ConstantDiscriminatorNode`](./docs/discriminatorNodes/ConstantDiscriminatorNode.md)
    - [`FieldDiscriminatorNode`](./docs/discriminatorNodes/FieldDiscriminatorNode.md)
    - [`SizeDiscriminatorNode`](./docs/discriminatorNodes/SizeDiscriminatorNodemds)
- [`LinkNode`](./docs/linkNodes/README.md) (abstract)
    - [`AccountLinkNode`](./docs/linkNodes/AccountLinkNode.md)
    - [`DefinedTypeLinkNode`](./docs/linkNodes/DefinedTypeLinkNode.md)
    - [`InstructionAccountLinkNode`](./docs/linkNodes/InstructionAccountLinkNode.md)
    - [`InstructionArgumentLinkNode`](./docs/linkNodes/InstructionArgumentLinkNode.md)
    - [`InstructionLinkNode`](./docs/linkNodes/InstructionLinkNode.md)
    - [`PdaLinkNode`](./docs/linkNodes/PdaLinkNode.md)
    - [`ProgramLinkNode`](./docs/linkNodes/ProgramLinkNode.md)
- [`PdaSeedNode`](./docs/pdaSeedNodes/README.md) (abstract)
    - [`ConstantPdaSeedNode`](./docs/pdaSeedNodes/ConstantPdaSeedNode.md)
    - [`VariablePdaSeedNode`](./docs/pdaSeedNodes/VariablePdaSeedNode.md)
- [`TypeNode`](./docs/typeNodes/README.md) (abstract)
    - [`AmountTypeNode`](./docs/typeNodes/AmountTypeNode.md)
    - [`ArrayTypeNode`](./docs/typeNodes/ArrayTypeNode.md)
    - [`BooleanTypeNode`](./docs/typeNodes/BooleanTypeNode.md)
    - [`BytesTypeNode`](./docs/typeNodes/BytesTypeNode.md)
    - [`DateTimeTypeNode`](./docs/typeNodes/DateTimeTypeNode.md)
    - [`EnumEmptyVariantTypeNode`](./docs/typeNodes/EnumEmptyVariantTypeNode.md)
    - [`EnumStructVariantTypeNode`](./docs/typeNodes/EnumStructVariantTypeNode.md)
    - [`EnumTupleVariantTypeNode`](./docs/typeNodes/EnumTupleVariantTypeNode.md)
    - [`EnumTypeNode`](./docs/typeNodes/EnumTypeNode.md)
    - [`EnumVariantTypeNode`](./docs/typeNodes/EnumVariantTypeNode.md) (abstract)
    - [`FixedSizeTypeNode`](./docs/typeNodes/FixedSizeTypeNode.md)
    - [`HiddenPrefixTypeNode`](./docs/typeNodes/HiddenPrefixTypeNode.md)
    - [`HiddenSuffixTypeNode`](./docs/typeNodes/HiddenSuffixTypeNode.md)
    - [`MapTypeNode`](./docs/typeNodes/MapTypeNode.md)
    - [`NestedTypeNode`](./docs/typeNodes/NestedTypeNode.md) (helper)
    - [`NumberTypeNode`](./docs/typeNodes/NumberTypeNode.md)
    - [`OptionTypeNode`](./docs/typeNodes/OptionTypeNode.md)
    - [`PostOffsetTypeNode`](./docs/typeNodes/PostOffsetTypeNode.md)
    - [`PreOffsetTypeNode`](./docs/typeNodes/PreOffsetTypeNode.md)
    - [`PublicKeyTypeNode`](./docs/typeNodes/PublicKeyTypeNode.md)
    - [`RemainderOptionTypeNode`](./docs/typeNodes/RemainderOptionTypeNode.md)
    - [`SentinelTypeNode`](./docs/typeNodes/SentinelTypeNode.md)
    - [`SetTypeNode`](./docs/typeNodes/SetTypeNode.md)
    - [`SizePrefixTypeNode`](./docs/typeNodes/SizePrefixTypeNode.md)
    - [`SolAmountTypeNode`](./docs/typeNodes/SolAmountTypeNode.md)
    - [`StringTypeNode`](./docs/typeNodes/StringTypeNode.md)
    - [`StructFieldTypeNode`](./docs/typeNodes/StructFieldTypeNode.md)
    - [`StructTypeNode`](./docs/typeNodes/StructTypeNode.md)
    - [`TupleTypeNode`](./docs/typeNodes/TupleTypeNode.md)
    - [`ZeroableOptionTypeNod`](./docs/typeNodes/ZeroableOptionTypeNod.md)
- [`ValueNode`](./docs/valueNodes/README.md) (abstract)
    - [`ArrayValueNode`](./docs/valueNodes/ArrayValueNode.md)
    - [`BooleanValueNode`](./docs/valueNodes/BooleanValueNode.md)
    - [`BytesValueNode`](./docs/valueNodes/BytesValueNode.md)
    - [`ConstantValueNode`](./docs/valueNodes/ConstantValueNode.md)
    - [`EnumValueNode`](./docs/valueNodes/EnumValueNode.md)
    - [`MapEntryValueNode`](./docs/valueNodes/MapEntryValueNode.md)
    - [`MapValueNode`](./docs/valueNodes/MapValueNode.md)
    - [`NoneValueNode`](./docs/valueNodes/NoneValueNode.md)
    - [`NumberValueNode`](./docs/valueNodes/NumberValueNode.md)
    - [`PublicKeyValueNode`](./docs/valueNodes/PublicKeyValueNode.md)
    - [`SetValueNode`](./docs/valueNodes/SetValueNode.md)
    - [`SomeValueNode`](./docs/valueNodes/SomeValueNode.md)
    - [`StringValueNode`](./docs/valueNodes/StringValueNode.md)
    - [`StructFieldValueNode`](./docs/valueNodes/StructFieldValueNode.md)
    - [`StructValueNode`](./docs/valueNodes/StructValueNode.md)
    - [`TupleValueNode`](./docs/valueNodes/TupleValueNode.md)
