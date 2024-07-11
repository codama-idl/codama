# Kinobi ➤ Visitors ➤ Core

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/visitors-core.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/visitors-core.svg?style=flat&label=%40kinobi-so%2Fvisitors-core
[npm-url]: https://www.npmjs.com/package/@kinobi-so/visitors-core

This package provides core interfaces and utilities for creating visitors for Kinobi IDLs.

## Installation

```sh
pnpm install @kinobi-so/visitors-core
```

> [!NOTE]
> This package is included in the [`@kinobi-so/visitors`](../visitors) package and in the main [`kinobi`](../library) library. Meaning, you already have access to its content if you are installing Kinobi in one of these ways.
>
> ```sh
> pnpm install @kinobi-so/visitors
> pnpm install kinobi
> ```

## Getting started with visitors

### The `Visitor` type

The type `Visitor<T>` is the core interface for defining Kinobi visitors. The type parameter `T` is used to define the return type of the visitor. For instance, here's the definition of a visitor that goes through the nodes and returns a number.

```ts
let myNumberVisitor: Visitor<number>;
```

The `Visitor` type accepts a second type parameter which defines the scope of nodes accepted by the visitor. By default, the visitor accepts all nodes. However, you can restrict the visitor to a specific set of nodes by providing a union of node kinds.

```ts
let myVisitorForProgramNodesOnly: Visitor<number, 'programNode'>;
let myVisitorForTypeNodesOnly: Visitor<number, TypeNode>;
```

The definition of the `Visitor` type is an object such that, for each supported node kind, a function that accepts a node of that kind and returns a value of type `T` is defined. The name of the function must be camel cased, start with `visit` and finish with the name of the node kind without the `Node` suffix. For instance, the function for the `programNode` kind is named `visitProgram`.

### Writing your own visitor

To write your own custom visitor, you may simply define an object with the appropriate functions. For instance, here's a visitor that only visit `ProgramNodes` and returns the number of accounts in the program.

```ts
const accountCounterVisitor: Visitor<number, 'programNode'> = {
    visitProgram: (node: ProgramNode) => node.accounts.length,
};
```

Note that it is recommended to return visitors from functions so we can easily reuse them and parameterize them. Additionally, this allows our code to be tree-shaken by the bundler. As we will see in this documentation, all provided visitors are returned from functions even if they don't take any parameter.

Here's our previous example updated to accept a `multiplier` parameter.

```ts
const accountCounterVisitor = (multiplier = 1): Visitor<number, 'programNode'> => ({
    visitProgram: (node: ProgramNode) => node.accounts.length * multiplier,
});
```

In practice, writing a visitor manually can be cumbersome as a function must be provided for each supported node kind. Therefore, it is recommended to compose visitors from a set of core visitors provided by this package and extend them to suit your needs. We will see how to do this in the next sections.

### Visiting nodes

Once we have a visitor, we can visit any node it supports by calling the `visit` function. This function accepts a node and a visitor of type `Visitor<T>` and returns a type `T`.

```ts
const counter: number = visit(programNode, accountCounterVisitor());
```

The `visitOrElse` function can also be used to gracefully handle the case where the node is not supported by the visitor. In this case, a fallback logic — provided as a third argument — is used to compute the result.

```ts
const counter: number = visit(stringTypeNode, accountCounterVisitor(), () => 0);
```

Also note that, if you are using [the `Kinobi` interface](../library/README#kinobi) — which is a simple wrapper around a `RootNode` — you may visit that root node using the provided helpers:

```ts
// Runs the visitor and returns the result.
const result: number = kinobi.accept(myNumberVisitor());

// Runs the visitor and updates the wrapped `RootNode` with the result.
kinobi.update(myTransformerVisitor());
```

## Core visitors

As mentionned in the previous section, creating visitors is much easier when we start from a set of core visitors and extend them to suit our needs. This prevents us from having to write a function for each supported node and allows us to focus on the logic we want to implement.

-   voidVisitor.ts
-   staticVisitor.ts
-   identityVisitor.ts
-   nonNullableIdentityVisitor.ts
-   mergeVisitor.ts
-   singleNodeVisitor.ts

## Composing visitors

-   mapVisitor.ts
-   extendVisitor.ts
-   interceptVisitor.ts
-   tapVisitor.ts
-   pipe.ts

## Recording node stacks

-   NodeStack.ts
-   recordNodeStackVisitor.ts

## Selecting nodes

-   NodeSelector.ts

## Transforming nodes

-   bottomUpTransformerVisitor.ts
-   topDownTransformerVisitor.ts
-   deleteNodesVisitor.ts

## String representations

-   getDebugStringVisitor.ts
-   getUniqueHashStringVisitor.ts
-   consoleLogVisitor.ts

## Resolving link nodes

-   LinkableDictionary.ts
-   recordLinkablesVisitor.ts

## Others useful visitors

-   getByteSizeVisitor.ts
-   getResolvedInstructionInputsVisitor.ts
-   removeDocsVisitor.ts
