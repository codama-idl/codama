# Codama ➤ Main Library

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/codama.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/codama.svg?style=flat&label=%40codama%2Fnodes
[npm-url]: https://www.npmjs.com/package/codama

This package is the main library for Codama. It re-exports most of the other packages in the Codama monorepo and offers a `Codama` type with a few helpers to help bind everything together.

## Installation

```sh
pnpm install codama
```

## Packages included

This package includes the following packages. Note that some of them also re-export other packages.

-   [`@codama/errors`](../errors)
-   [`@codama/nodes`](../nodes)
    -   [`@codama/node-types`](../node-types)
-   [`@codama/validators`](../validators)
-   [`@codama/visitors`](../visitors)
    -   [`@codama/visitor-core`](../visitor-core)

## The Codama helper

Additionally, this package offers a `Codama` type and a few helper functions to help you work with Codama IDLs.

### `Codama`

The `Codama` interface wraps a `RootNode` and offers some helper methods to work with it.

```ts
export interface Codama {
    accept<T>(visitor: Visitor<T>): T;
    clone(): Codama;
    getJson(): string;
    getRoot(): RootNode;
    update(visitor: Visitor<Node | null>): void;
}
```

The `accept` function allows us to visit the wrapped `RootNode` using the provided visitor.

```ts
// Log the Codama IDL in the console.
codama.accept(consoleLogVisitor(getDebugStringVisitor({ indent: true })));
```

The `update` function also accepts a visitor, but it uses the return value of that visitor to update the wrapped `RootNode`. This means that, given a `RootNode`, the provided visitor should also return a `RootNode`. An error will be thrown otherwise.

```ts
// Delete account nodes named "mint".
codama.update(deleteNodesVisitor(['[accountNode]mint']));

// Transform all number nodes into u64 number nodes.
codama.update(
    bottomUpTransformerVisitor([
        {
            select: '[numberTypeNode]',
            transform: () => numberTypeNode(u64),
        },
    ]),
);
```

Other helper functions include:

-   `clone()`: Creates a new instance of the `Codama` interface with a deep copy of the wrapped `RootNode`.
-   `getJson()`: Returns the JSON representation of the Codama IDL.
-   `getRoot()`: Returns the wrapped `RootNode`.

```ts
const clonedKinobi = codama.clone();
const jsonIdl = codama.getJson();
const rootNode = codama.getRoot();
```

### `createFromRoot(rootNode)`

The `createFromRoot` function creates a new instance of the `Codama` interface from a `RootNode`.

```ts
const codama = createFromRoot(rootNode(programNode({ ... })));
```

### `createFromJson(jsonIdl)`

The `createFromJson` function creates a new instance of the `Codama` interface from a JSON representation of a `RootNode`.

```ts
const json: string = fs.readFileSync('path/to/kinobiIdl.json', 'utf-8');
const codama = createFromJson(json);
```
