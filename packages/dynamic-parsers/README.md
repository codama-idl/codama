# Codama ➤ Dynamic Parsers

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/dynamic-parsers.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/dynamic-parsers.svg?style=flat&label=%40codama%2Fdynamic-parsers
[npm-url]: https://www.npmjs.com/package/@codama/dynamic-parsers

This package provides a set of helpers that, given any Codama IDL, dynamically identifies and parses any byte array into deserialized accounts and instructions.

## Installation

```sh
pnpm install @codama/dynamic-parsers
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Types

### `ParsedData<TNode>`

This type represents the result of identifying and parsing a byte array from a given root node. It provides us with the full `NodePath` of the identified node, as well as the data deserialized from the provided bytes.

```ts
type ParsedData<TNode extends AccountNode | InstructionNode> = {
    data: unknown;
    path: NodePath<TNode>;
};
```

## Functions

### `parseAccountData(rootNode, bytes)`

Given a `RootNode` and a byte array, this function will attempt to identify the correct account node and use it to deserialize the provided bytes. Therefore, it returns a `ParsedData<AccountNode>` object if the parsing was successful, or `undefined` otherwise.

```ts
const parsedData = parseAccountData(rootNode, bytes);
// ^ ParsedData<AccountNode> | undefined

if (parsedData) {
    const accountNode: AccountNode = getLastNodeFromPath(parsedData.path);
    const decodedData: unknown = parsedData.data;
}
```

### `parseInstructionData(rootNode, bytes)`

Similarly to `parseAccountData`, this function will match the provided bytes to an instruction node and deserialize them accordingly. It returns a `ParsedData<InstructionNode>` object if the parsing was successful, or `undefined` otherwise.

```ts
const parsedData = parseInstructionData(rootNode, bytes);
// ^ ParsedData<InstructionNode> | undefined

if (parsedData) {
    const instructionNode: InstructionNode = getLastNodeFromPath(parsedData.path);
    const decodedData: unknown = parsedData.data;
}
```

### `parseInstruction(rootNode, instruction)`

This function accepts a `RootNode` and an `Instruction` type — as defined in `@solana/instructions` — in order to return a `ParsedData<InstructionNode>` object that also includes an `accounts` array that match each `AccountMeta` with its corresponding account name.

```ts
const parsedData = parseInstruction(rootNode, instruction);

if (parsedData) {
    const namedAccounts = parsedData.accounts;
    // ^ Array<AccountMeta & { name: string }>
}
```

### `identifyAccountData`

This function tries to match the provided bytes to an account node, returning a `NodePath<AccountNode>` object if the identification was successful, or `undefined` otherwise. It is used by the `parseAccountData` function under the hood.

```ts
const path = identifyAccountData(root, bytes);
// ^ NodePath<AccountNode> | undefined

if (path) {
    const accountNode: AccountNode = getLastNodeFromPath(path);
}
```

### `identifyInstructionData`

This function tries to match the provided bytes to an instruction node, returning a `NodePath<InstructionNode>` object if the identification was successful, or `undefined` otherwise. It is used by the `parseInstructionData` function under the hood.

```ts
const path = identifyInstructionData(root, bytes);
// ^ NodePath<InstructionNode> | undefined

if (path) {
    const instructionNode: InstructionNode = getLastNodeFromPath(path);
}
```
