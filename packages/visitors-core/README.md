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

The following visitor functions accept a existing visitor and return a new visitor that extends or modifies the behavior of the provided visitor. These primitives can be used to create complex visitors by composing simpler ones.

### `extendVisitor`

The `extendVisitor` function accepts a base visitor and a set of function wrappers that are used to extend the behavior of the base visitor.

Each function wrapper is given the `node` being visited and an object composed of two elements:

-   `next`: A function that can be called to delegate to the base visitor — e.g. `next(node)`.
-   `self`: The visitor itself, allowing for recursive calls.

To illustrate this, consider the following base visitor that counts the number of nodes.

```ts
const baseVisitor = mergeVisitor(
    () => 1,
    (_, values) => values.reduce((a, b) => a + b, 1),
);
```

We can extend this visitor to increment the count by 10 when visiting a `PublicKeyTypeNode` like so:

```ts
const visitor = extendVisitor(baseVisitor, {
    visitPublicKeyType: (node, { next }) => next(node) + 10,
});

const result = visit(tupleTypeNode([publicKeyTypeNode(), numberTypeNode('u32')]), visitor);
// ^ 13
```

Notice how `next(node)` can be used to access the underlying visitor meaning we can extend both the input and the output of the base visitor.

Another example is to make use of the `self` property to recursively call the extended visitor. For instance, the following code only visits the first item of tuple types.

```ts
const visitor = extendVisitor(baseVisitor, {
    visitTupleType: (node, { self }) => visit(node.items[0], self) + 1,
});

const result = visit(tupleTypeNode([tupleTypeNode([publicKeyTypeNode()]), numberTypeNode('u32')]), visitor);
// ^ 3
```

### `interceptVisitor`

The `interceptVisitor` allows us to wrap every visiting function of a provided visitor into a given function. This function has access to the node being visited and a `next` function that can be called to delegate to the base visitor.

For instance, the following visitor intercepts a `voidVisitor` and captures events when visiting nodes.

```ts
const events: string[] = [];
const visitor = interceptVisitor(voidVisitor(), (node, next) => {
    events.push(`down:${node.kind}`);
    next(node);
    events.push(`up:${node.kind}`);
});

visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// events === [
//     'down:tupleTypeNode',
//     'down:numberTypeNode',
//     'up:numberTypeNode',
//     'down:publicKeyTypeNode',
//     'up:publicKeyTypeNode',
//     'up:tupleTypeNode',
// ]
```

### `tapVisitor`

The `tapVisitor` function allows us to tap into the visiting functions of a provided visitor without modifying its behavior. This means the returned visitor will behave exactly like the base visitor except that the provided function will be called for the specified node kind.

Note that the provided function must not return a value as it is only used for side effects.

```ts
let numberOfNumberNodes = 0;
const visitor = tapVisitor(voidVisitor(), 'numberTypeNode', node => {
    numberOfNumberNodes++;
});

visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// numberOfNumberNodes === 1
```

### `mapVisitor`

The `mapVisitor` function accepts a base visitor of type `Visitor<T>` and a function of type `(value: T) => U`; and returns a new visitor of type `Visitor<U>`.

```ts
// Gets a nested string representation of node kinds.
const baseVisitor = mergeVisitor(
    node => node.kind as string,
    (node, values) => `${node.kind}(${values.join(',')})`,
);

// Counts the number of characters in the string representation.
const visitor = mapVisitor(baseVisitor, (value: string): number => value.length);

const result = visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ 47
```

### `pipe`

The `pipe` helper function allows us to compose visitors in a more readable way. It accepts a base visitor and a set of visitor functions that are used to extend the behavior of the previous visitor at each step.

```ts
const visitor = pipe(
    baseVisitor,
    v => extendVisitor(v /** ... */),
    v => interceptVisitor(v /** ... */),
    v => mapVisitor(v /** ... */),
    v => tapVisitor(v /** ... */),
);
```

For instance, here's an example using the `pipe` function to transform an `identityVisitor` into a visitor that:

-   Transforms all number types into `u64` numbers.
-   Logs the amount of items in tuple types.
-   Wraps the visited node in a `DefinedTypeNode` labelled "gift".

```ts
const visitor = pipe(
    // Starts with the identity visitor.
    identityVisitor(),
    v =>
        // Extends the visitor to make all number types u64.
        extendVisitor(v, {
            visitNumberType: node => numberTypeNode('u64'),
        }),
    v =>
        // Log the amount of items in tuple types.
        tapVisitor(v, 'tupleTypeNode', node => {
            console.log(node.items.length);
        }),
    v =>
        // Wrap the visited node in a `DefinedTypeNode` labelled "gift".
        interceptVisitor(v, node => (node, next) => {
            return definedTypeNode({ name: 'gift', type: next(node) });
        }),
);
```

### `singleNodeVisitor`

The `singleNodeVisitor` function is a simple primitive that creates a `Visitor` that only visits a single node kind. It accepts a node kind and a function that is used to visit that node kind. Any other node kind will not be supported by the visitor.

```ts
const visitor = singleNodeVisitor('tupleTypeNode', node => node.items.length);

const result = visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ 2
```

Additionally, a `rootNodeVisitor` shortcut is provided to create a visitor that only visits `RootNodes`. This can be useful to design top-level visitors using custom logic.

For instance, we can create a visitor that takes a `RootNode` and update it through a series of other visitors before returning the updated `RootNode`.

```ts
const visitor = rootNodeVisitor((root: RootNode) => {
    let newRoot = root;
    newRoot = visit(newRoot, visitorA);
    newRoot = visit(newRoot, visitorB);
    newRoot = visit(newRoot, visitorC);
    return newRoot;
});
```

## Recording node stacks

### `NodeStack`

The `NodeStack` class is a utility that allows us to record the stack of nodes that led to a specific node.

For instance, consider the following node:

```ts
const node = definedTypeNode({
    name: 'myType',
    type: tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]),
});
```

In this example, the `numberTypeNode` can be reached using the following stack:

```ts
const stack = new NodeStack()
    .push(node) // -> definedTypeNode.
    .push(node.type) // -> tupleTypeNode.
    .push(node.type.items[0]); // -> numberTypeNode.
```

Once you have access to a `NodeStack` instance — provided by various utility visitors — you may use the following methods:

```ts
// Push a node to the stack.
nodeStack.push(node);
// Pop the last node out of the stack.
const lastNode = nodeStack.pop();
// Peek at the last node in the stack.
const lastNode = nodeStack.peek();
// Get all the nodes in the stack as an array.
const nodes = nodeStack.all();
// Check if the stack is empty.
const isEmpty = nodeStack.isEmpty();
// Clone the stack.
const clonedStack = nodeStack.clone();
// Get a string representation of the stack.
const stackString = nodeStack.toString();
```

### `recordNodeStackVisitor`

The `recordNodeStackVisitor` function gives us a convenient way to record the stack of each node currently being visited. It accepts a base visitor and an empty `NodeStack` instance that will automatically be pushed and popped as the visitor traverses the nodes. This means that we can inject the `NodeStack` instance into another extension of the visitor to access the stack whilst visiting the nodes.

For instance, here's how we can log the `NodeStack` of any base visitor as we visit the nodes.

```ts
const stack = new NodeStack();
const visitor = pipe(
    baseVisitor,
    v => recordNodeStackVisitor(v, stack),
    v =>
        interceptVisitor(v, (node, next) => {
            console.log(stack.clone().toString());
            return next(node);
        }),
);
```

## Selecting nodes

When visiting a tree of nodes, it is often useful to be explicit about the paths we want to select. For instance, I may want to delete all accounts from a program node named "token".

To take end, the `NodeSelector` type represents a node selection that can take two forms:

-   A `NodeSelectorFunction` of type `(node: Node, stack: NodeStack) => boolean`. In this case, the provided function is used to determine if the node should be selected.
-   A `NodeSelectorPath` of type `string`. In this case, the provided string uses a simple syntax to select nodes.

The `NodeSelectorPath` syntax is as follows:

-   Plain text is used to match the name of a node, if any. For instance, `token` will match any node named "token".
-   Square brackets `[]` are used to match the kind of a node. For instance, `[programNode]` will match any `ProgramNode`.
-   Plain text and square brackets can be combined to match both the name and the kind of a node. For instance, `[programNode]token` will match any `ProgramNode` named "token".
-   Plain texts and/or square brackets can be chained using dots `.` to match several nodes in the current `NodeStack`.
-   Dot-separated paths must follow the provided order but do not need to be contigious or exhaustive. This means that `a.b.c` will match a `NodeStack` that looks like `x.a.y.b.z.c` but not `b.a.c`.
-   The last item of a dot-separated path must match the last node of the `NodeStack`. For instance, `a.b` will not match `a.b.x`.
-   The wildcard `*` can be used at the end of the path to match any node within the matching path. For instance, `a.b.*` will match `a.b.x`.

Here are some examples:

```ts
'[accountNode]';
// Matches any `AccountNode`.

'mint';
// Matches any node named "mint".

'[accountNode]mint';
// Matches any `AccountNode` named "mint".

'[programNode]token.[accountNode]mint';
// Matches any `AccountNode` named "mint" within a `ProgramNode` named "token".

'[programNode]token.*';
// Matches any node within a `ProgramNode` named "token" (excluding the program node itself).

'token.[structTypeNode].amount';
// Matches any node named "amount" within a `StructTypeNode` within any node named "token".
```

The `NodeSelector` type is used by various visitors such as the `bottomUpTransformerVisitor` or the `deleteNodesVisitor` to help us select the nodes we want to transform or delete.

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
