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

## Documentation

The Codama IDL is composed of various nodes that describe different aspects of a Solana program. Some nodes are categorised together as they share a similar purpose. For instance, all the nodes that describe a data structure that can be encoded and decoded into buffers are grouped under the `TypeNode` category.

The nodes themselves are defined by the [Codama specification](https://github.com/codama-idl/spec), which is the canonical reference for this package. Every node has its own generated documentation page describing its attributes and providing worked TypeScript examples. Head over to the [spec documentation](https://github.com/codama-idl/spec/blob/main/v1/docs/README.md) to explore all available nodes and their categories.

## Helpers

For every concrete node in the spec, this package exports a factory function named after it — e.g. `accountNode(input)` creates an `AccountNode` and `numberTypeNode('u64')` creates a `NumberTypeNode`. The worked examples on each documentation page use these helpers directly. The package also exports the matching TypeScript types, including the `Node` union type representing all available nodes and category unions such as `TypeNode` and `ValueNode`.
