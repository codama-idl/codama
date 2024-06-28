# Kinobi ➤ Nodes

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/nodes.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/nodes.svg?style=flat&label=%40kinobi-so%2Fnodes
[npm-url]: https://www.npmjs.com/package/@kinobi-so/nodes

## Installation

```sh
pnpm install @kinobi-so/nodes
```

> [!NOTE]
> This package is included in the main [`kinobi`](../library) package. Meaning, you already have access to its content if you are installing Kinobi this way.
>
> ```sh
> pnpm install kinobi
> ```

## Documentation

This package defines the various nodes that make up the Kinobi IDL. It provides types and helper functions to work with these nodes. If you are looking for a type-only version of these nodes, you can find them in the [`@kinobi-so/node-types`](../node-types) package.

The Kinobi IDL is composed of various nodes that describe different aspects of a Solana program. Some nodes are categorised together as they share a similar purpose. For instance, all the nodes that describe a data structure that can be encoded and decoded into buffers are grouped under the `TypeNode` category.

Below are all of the available nodes and their documentation. Also note that you can refer to any node using the [`Node`](./docs/README.md) helper type.

-   [`AccountNode`](./docs/AccountNode.md)
-   [`DefinedTypeNode`](./docs/DefinedTypeNode.md)
-   [`ErrorNode`](./docs/ErrorNode.md)
-   [`InstructionAccountNode`](./docs/InstructionAccountNode.md)
-   [`InstructionArgumentNode`](./docs/InstructionArgumentNode.md)
-   [`InstructionByteDeltaNode`](./docs/InstructionByteDeltaNode.md)
-   [`InstructionNode`](./docs/InstructionNode.md)
-   [`InstructionRemainingAccountsNode`](./docs/InstructionRemainingAccountsNode.md)
-   [`PdaNode`](./docs/PdaNode.md)
-   [`ProgramNode`](./docs/ProgramNode.md)
-   [`RootNode`](./docs/RootNode.md)
-   [`TypeNode`](./docs/typeNodes/README.md) (abstract)
    -   [`AmountTypeNode`](./docs/typeNodes/AmountTypeNode.md)
    -   [`ArrayTypeNode`](./docs/typeNodes/ArrayTypeNode.md)
    -   [`BooleanTypeNode`](./docs/typeNodes/BooleanTypeNode.md)
    -   [`BytesTypeNode`](./docs/typeNodes/BytesTypeNode.md)
    -   [`DateTimeTypeNode`](./docs/typeNodes/DateTimeTypeNode.md)
    -   [`EnumEmptyVariantTypeNode`](./docs/typeNodes/EnumEmptyVariantTypeNode.md)
    -   [`EnumStructVariantTypeNode`](./docs/typeNodes/EnumStructVariantTypeNode.md)
    -   [`EnumTupleVariantTypeNode`](./docs/typeNodes/EnumTupleVariantTypeNode.md)
    -   [`EnumTypeNode`](./docs/typeNodes/EnumTypeNode.md)
    -   [`EnumVariantTypeNode`](./docs/typeNodes/EnumVariantTypeNode.md)
    -   [`FixedSizeTypeNode`](./docs/typeNodes/FixedSizeTypeNode.md)
    -   [`HiddenPrefixTypeNode`](./docs/typeNodes/HiddenPrefixTypeNode.md)
    -   [`HiddenSuffixTypeNode`](./docs/typeNodes/HiddenSuffixTypeNode.md)
    -   [`MapTypeNode`](./docs/typeNodes/MapTypeNode.md)
    -   [`NestedTypeNode`](./docs/typeNodes/NestedTypeNode.md)
    -   [`NumberTypeNode`](./docs/typeNodes/NumberTypeNode.md)
    -   [`OptionTypeNode`](./docs/typeNodes/OptionTypeNode.md)
    -   [`PostOffsetTypeNode`](./docs/typeNodes/PostOffsetTypeNode.md)
    -   [`PreOffsetTypeNode`](./docs/typeNodes/PreOffsetTypeNode.md)
    -   [`PublicKeyTypeNode`](./docs/typeNodes/PublicKeyTypeNode.md)
    -   [`SentinelTypeNode`](./docs/typeNodes/SentinelTypeNode.md)
    -   [`SetTypeNode`](./docs/typeNodes/SetTypeNode.md)
    -   [`SizePrefixTypeNode`](./docs/typeNodes/SizePrefixTypeNode.md)
    -   [`SolAmountTypeNode`](./docs/typeNodes/SolAmountTypeNode.md)
    -   [`StringTypeNode`](./docs/typeNodes/StringTypeNode.md)
    -   [`StructFieldTypeNode`](./docs/typeNodes/StructFieldTypeNode.md)
    -   [`StructTypeNode`](./docs/typeNodes/StructTypeNode.md)
    -   [`TupleTypeNode`](./docs/typeNodes/TupleTypeNode.md)
    -   [`ZeroableOptionTypeNod`](./docs/typeNodes/ZeroableOptionTypeNod.md)
