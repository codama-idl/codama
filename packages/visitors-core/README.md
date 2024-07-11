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
let myVisitorForTypeNodesOnly: Visitor<number, TypeNode['kind']>;
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

As mentionned in the previous section, creating visitors is much easier when we start from a set of core visitors and extend them to suit our needs.

Therefore, let's start by exploring the core visitors provided by this package.

### Filtering node kinds

Before we list each available core visitor, it is important to know that each of these functions optionally accept a node kind or an array of node kinds **as their last argument**. This allows us to restrict the visitor to a specific set of nodes and will return a `Visitor<T, U>` instance where `U` is the union of the provided node kinds.

Here are some examples:

```ts
// This visitor only accepts `ProgramNodes`.
const visitor: Visitor<number, 'programNode'> = myNumberVisitor('programNode');

// This visitor accepts both `NumberTypeNodes` and `StringTypeNodes`.
const visitor: Visitor<number, 'numberTypeNode' | 'stringTypeNode'> = myNumberVisitor([
    'numberTypeNode',
    'stringTypeNode',
]);

// This visitor accepts all type nodes.
const visitor: Visitor<number, TypeNode['kind']> = myNumberVisitor(TYPE_NODES);

// This visitor accepts all nodes.
const visitor: Visitor<number> = myNumberVisitor();
```

In the following sections describing the core visitors, this exact pattern can be used to restrict the visitors to specific node kinds. We won't cover this for each visitor but know that you can achieve this via the last argument of each function.

### `voidVisitor`

The `voidVisitor` traverses all the nodes and ends up returning `undefined`, regardless of the node kind.

```ts
visit(node, voidVisitor());
// ^ undefined
```

Visiting a node with this visitor does nothing and causes no side effect. However, it can be a great starting point for creating new visitors by extending certain visiting functions of the `voidVisitor`.

### `staticVisitor`

The `staticVisitor` accepts a function that is used for every node. The provided function is called with the node being visited.

```ts
const visitor: Visitor<string> = staticVisitor(node => `Visiting ${node.kind}`);
const kind = visit(numberTypeNode('u32'), visitor);
// ^ "Visiting numberTypeNode"
```

This visitor can be used to create simple visitors where each node share a similar logic or to provide a starting point for more complex visitors.

### `identityVisitor`

The `identityVisitor` traverses the nodes and returns a deep copy of the visited node.

```ts
const node = visit(numberTypeNode('u32'), identityVisitor());
// ^ A different instance of numberTypeNode('u32')
```

Note that the returned visitor is of type `Visitor<Node | null>` meaning this visitor allows for nodes to be deleted — i.e. marked as `null`. The `identityVisitor` is able to resolved nested `null` references depending on the node kind. For instance, if a `tupleTypeNode` contains two items and the first one is `null` — after having visited its children — then, the `tupleTypeNode` will only contain the second item. It is also possible for a nested `null` reference to bubble all the way up if it cannot be resolved.

Here are some examples if this behavior by overriding the `visitPublicKeyType` function to return `null`.

```ts
const visitor = identityVisitor();
visitor.visitPublicKeyType = () => null;

const node = visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ tupleTypeNode([numberTypeNode('u32')])

const node = visit(definedTypeNode({ name: 'address', type: publicKeyTypeNode() }), visitor);
// ^ null
```

Also note that, because the visitor is of type `Node | null`, it is technically possible to extend it such that a node of a different kind is returned.

```ts
const visitor = identityVisitor();
visitor.visitPublicKeyType = () => fixedSizeTypeNode(stringTypeNode('base58'), 32);
```

### `nonNullableIdentityVisitor`

The `nonNullableIdentityVisitor` works the same way as the `identityVisitor` but it does not allow nodes to be deleted. That is, its return type must be a `Node` and not `Node | null`.

```ts
const node = visit(numberTypeNode('u32'), nonNullableIdentityVisitor());
// ^ A different instance of numberTypeNode('u32')
```

### `mergeVisitor`

The `mergeVisitor` returns a `Visitor<T>` by accepting two functions such that:

-   The first function is used on the leaves of the Kinobi IDL and return a type `T`.
-   The second function is used to merge the values `T[]` of the children of a node and aggregate them into a type `T`.

For instance, here is how we can use the `mergeVisitor` to create a nested string representation of node kinds.

```ts
const visitor = mergeVisitor(
    (node): string => node.kind,
    (node, values: string[]): string => `${node.kind}(${values.join(',')})`,
);

const result = visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ "tupleTypeNode(numberTypeNode,publicKeyTypeNode)"
```

Here's another example counting the number of traversed nodes.

```ts
const visitor = mergeVisitor(
    () => 1,
    (, values) => values.reduce((a, b) => a + b, 1),
);

const result = visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ 3
```

The `mergeVisitor` is a powerful starting point to create aggregating visitors.

## Composing visitors

### `extendVisitor`

TODO

### `interceptVisitor`

TODO

### `tapVisitor`

TODO

### `mapVisitor`

TODO

### `pipe`

TODO

### `singleNodeVisitor`

TODO

-   singleNodeVisitor
-   rootNodeVisitor

## Recording node stacks

### `NodeStack`

TODO

### `recordNodeStackVisitor`

TODO

## Selecting nodes

-   NodeSelector.ts

## Transforming nodes

### `bottomUpTransformerVisitor`

TODO

### `topDownTransformerVisitor`

TODO

### `deleteNodesVisitor`

TODO

## String representations

### `getDebugStringVisitor`

TODO

### `getUniqueHashStringVisitor`

TODO

### `consoleLogVisitor`

TODO

## Resolving link nodes

### `LinkableDictionary`

TODO

### `recordLinkablesVisitor`

TODO

## Others useful visitors

### `getByteSizeVisitor`

TODO

### `getResolvedInstructionInputsVisitor`

TODO

### `removeDocsVisitor`

TODO
