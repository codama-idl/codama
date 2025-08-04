# Codama ➤ Visitors ➤ Core

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/visitors-core.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/visitors-core.svg?style=flat&label=%40codama%2Fvisitors-core
[npm-url]: https://www.npmjs.com/package/@codama/visitors-core

This package provides core interfaces and utilities for creating visitors for Codama IDLs.

## Installation

```sh
pnpm install @codama/visitors-core
```

> [!NOTE]
> This package is included in the [`@codama/visitors`](../visitors) package and in the main [`codama`](../library) library. Meaning, you already have access to its content if you are installing Codama in one of these ways.
>
> ```sh
> pnpm install @codama/visitors
> pnpm install codama
> ```

## Getting started with visitors

### The `Visitor` type

The type `Visitor<T>` is the core interface for defining Codama visitors. The type parameter `T` is used to determine the return type of the visitor. For instance, here's the definition of a visitor that goes through the nodes and returns a number.

```ts
let myNumberVisitor: Visitor<number>;
```

The `Visitor` type accepts a second type parameter which defines the scope of nodes accepted by the visitor. By default, the visitor accepts all nodes. However, you can restrict the visitor to a specific set of nodes by providing a union of node kinds.

```ts
let myVisitorForProgramNodesOnly: Visitor<number, 'programNode'>;
let myVisitorForTypeNodesOnly: Visitor<number, TypeNode['kind']>;
```

The definition of the `Visitor` type is an object such that, for each supported node kind, a function that accepts a node of that kind and returns a value of type `T` is defined. The name of the function must be camel-cased, start with `visit` and finish with the name of the node kind without the `Node` suffix. For instance, the function for the `programNode` kind is named `visitProgram`.

### Writing your own visitor

To write a custom visitor, you may simply define an object with the appropriate functions. For instance, here's a visitor that only visits `ProgramNodes` and returns the number of accounts in the program.

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

Also note that, if you are using [the `Codama` interface](../library/README#codama) — which is a simple wrapper around a `RootNode` — you may visit that root node using the provided helpers:

```ts
// Runs the visitor and returns the result.
const result: number = codama.accept(myNumberVisitor());

// Runs the visitor and updates the wrapped `RootNode` with the result.
codama.update(myTransformerVisitor());
```

## Core visitors

As mentioned in the previous section, creating visitors is much easier when we start from a set of core visitors and extend them to suit our needs.

Therefore, let's start by exploring the core visitors provided by this package.

### Filtering node kinds

Before we list each available core visitor, it is important to know that each of these functions optionally accepts a node kind or an array of node kinds **as a `keys` attribute in their `options`**. This allows us to restrict the visitor to a specific set of nodes and will return a `Visitor<T, U>` instance where `U` is the union of the provided node kinds.

Here are some examples:

```ts
// This visitor only accepts `ProgramNodes`.
const visitor: Visitor<number, 'programNode'> = voidVisitor({ keys: 'programNode' });

// This visitor accepts both `NumberTypeNodes` and `StringTypeNodes`.
const visitor: Visitor<number, 'numberTypeNode' | 'stringTypeNode'> = voidVisitor({
    keys: ['numberTypeNode', 'stringTypeNode'],
});

// This visitor accepts all type nodes.
const visitor: Visitor<number, TypeNode['kind']> = voidVisitor({ keys: TYPE_NODES });

// This visitor accepts all nodes.
const visitor: Visitor<number> = voidVisitor();
```

In the following sections describing the core visitors, this exact pattern can be used to restrict the visitors to specific node kinds. We won't cover this for each visitor but know that you can achieve this via the `keys` option of each function.

### `voidVisitor`

The `voidVisitor` traverses all the nodes and ends up returning `undefined`, regardless of the node kind.

```ts
visit(node, voidVisitor());
// ^ undefined
```

Visiting a node with this visitor does nothing and causes no side effects. However, it can be a great starting point for creating new visitors by extending certain visiting functions of the `voidVisitor`.

### `staticVisitor`

The `staticVisitor` accepts a function that is used for every node. The provided function is called with the node being visited.

```ts
const visitor: Visitor<string> = staticVisitor(node => `Visiting ${node.kind}`);
const kind = visit(numberTypeNode('u32'), visitor);
// ^ "Visiting numberTypeNode"
```

This visitor can be used to create simple visitors where each node shares a similar logic or to provide a starting point for more complex visitors.

### `identityVisitor`

The `identityVisitor` traverses the nodes and returns a deep copy of the visited node.

```ts
const node = visit(numberTypeNode('u32'), identityVisitor());
// ^ A different instance of numberTypeNode('u32')
```

Note that the returned visitor is of type `Visitor<Node | null>` meaning this visitor allows for nodes to be deleted — i.e. marked as `null`. The `identityVisitor` can resolve nested `null` references depending on the node kind. For instance, if a `tupleTypeNode` contains two items and the first one is `null` — after having visited its children — then, the `tupleTypeNode` will only contain the second item. It is also possible for a nested `null` reference to bubble up if it cannot be resolved.

Here are some examples of this behaviour by overriding the `visitPublicKeyType` function to return `null`.

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

- The first function is used on the leaves of the Codama IDL and returns a type `T`.
- The second function is used to merge the values `T[]` of the children of a node and aggregate them into a type `T`.

For instance, here is how we can use the `mergeVisitor` to create a nested string representation of node kinds.

```ts
const visitor = mergeVisitor(
    (node): string => node.kind,
    (node, values: string[]): string => `${node.kind}(${values.join(',')})`,
);

const result = visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ "tupleTypeNode(numberTypeNode,publicKeyTypeNode)"
```

Here's another example, counting the number of traversed nodes.

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

The following visitor functions accept an existing visitor and return a new visitor that extends or modifies the behaviour of the provided visitor. These primitives can be used to create complex visitors by composing simpler ones.

### `extendVisitor`

The `extendVisitor` function accepts a base visitor and a set of function wrappers that are used to extend the behaviour of the base visitor.

Each function wrapper is given the `node` being visited and an object composed of two elements:

- `next`: A function that can be called to delegate to the base visitor — e.g. `next(node)`.
- `self`: The visitor itself, allowing for recursive calls.

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

### `interceptFirstVisitVisitor`

The `interceptFirstVisitVisitor` works the same way as the `interceptVisitor` but only intercepts the first visit of a node. This means that the provided function is called when visiting the specific node provided but not when visiting its children. The parameters are the same as for the `interceptVisitor`.

For instance, the following visitor intercepts a `voidVisitor` and captures events only during the first visit.

```ts
const events: string[] = [];
const visitor = interceptFirstVisitVisitor(voidVisitor(), (node, next) => {
    events.push(`down:${node.kind}`);
    next(node);
    events.push(`up:${node.kind}`);
});

visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// events === [
//     'down:tupleTypeNode',
//     'up:tupleTypeNode',
// ]
```

### `tapVisitor`

The `tapVisitor` function allows us to tap into the visiting functions of a provided visitor without modifying its behaviour. This means the returned visitor will behave exactly like the base visitor except that the provided function will be called for the specified node kind.

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

The `pipe` helper function allows us to compose visitors in a more readable way. It accepts a base visitor and a set of visitor functions that are used to extend the behaviour of the previous visitor at each step.

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

- Transforms all number types into `u64` numbers.
- Logs the amount of items in tuple types.
- Wraps the visited node in a `DefinedTypeNode` labelled "gift".

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

For instance, we can create a visitor that takes a `RootNode` and updates it through a series of other visitors before returning the updated `RootNode`.

```ts
const visitor = rootNodeVisitor((root: RootNode) => {
    let newRoot = root;
    newRoot = visit(newRoot, visitorA);
    newRoot = visit(newRoot, visitorB);
    newRoot = visit(newRoot, visitorC);
    return newRoot;
});
```

## Recording node paths

### `NodePath`

The `NodePath` type defines an immutable array of `Nodes` that represents any path of nodes in the Codama IDL. It accepts an optional type parameter that tells us the type of the last node in the path. For instance `NodePath<NumberTypeNode>` represents a path of node ending with a `NumberTypeNode`.

Additionally, there are several utility functions to use with `NodePath` instances:

```ts
// An example of a node path.
const path: NodePath<AccountNode> = [rootNode, programNode, accountNode];

// Access the last node in the path. I.e. given NodePath<T>, returns T.
const lastNode: AccountNode = getLastNodeFromPath(path);

// Access the first/last node of a specific kind in the path.
const firstProgramNode: ProgramNode | undefined = findFirstNodeFromPath(path, 'programNode');
const lastProgramNode: ProgramNode | undefined = findLastNodeFromPath(path, 'programNode');

// Access the last program/instruction node in the path (sugar for `findLastNodeFromPath`).
const programNode: ProgramNode | undefined = findProgramNodeFromPath(path);
const instructionNode: InstructionNode | undefined = findInstructionNodeFromPath(path);

// Get the subpath of a path from the beginning to the last node matching a specific kind.
const subpath: NodePath = getNodePathUntilLastNode(path, 'programNode');
// ^ [rootNode, programNode]

// Check that a path is not empty.
if (isFilledNodePath(path as NodePath)) {
    path satisfies NodePath<Node>;
}

// Check that a path finishes with a node matching the provided kind or kinds.
if (isNodePath(path as NodePath, ['AccountNode', 'InstructionNode'])) {
    path satisfies NodePath<AccountNode | InstructionNode>;
}

// Assert that a path finishes with a node matching the provided kind or kinds.
assertIsNodePath(path as NodePath, ['AccountNode', 'InstructionNode']);
path satisfies NodePath<AccountNode | InstructionNode>;

// Display paths as strings or arrays of strings.
nodePathToStringArray(path); // -> ['[rootNode]', '[programNode]token', '[accountNode]mint']
nodePathToString(path); // -> "[rootNode] > [programNode]token > [accountNode]mint"
```

### `NodeStack`

The `NodeStack` class is a utility that allows us to record the path of nodes that led to the node being currently visited. It is essentially a mutable version of `NodePath` that pushes and pops `Nodes` as we go down and up the tree of nodes.

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

Once you have access to a `NodeStack` instance, you may use the following methods:

```ts
// Push a node to the stack.
nodeStack.push(node);

// Pop the last node out of the stack.
const lastNode = nodeStack.pop();

// Peek at the last node in the stack.
const lastNode = nodeStack.peek();

// Get all the nodes in the stack as an immutable `NodePath` array.
const path: NodePath = nodeStack.getPath();

// Get a `NodePath` whilst asserting on the last node kind.
const path: NodePath<AccountNode> = nodeStack.getPath('accountNode');

// Check if the stack is empty.
const isEmpty = nodeStack.isEmpty();

// Clone the stack.
const clonedStack = nodeStack.clone();
```

Additionally, it is possible to save and restore multiple node paths within a `NodeStack` by using the `pushPath` and `popPath` methods. This is for more advanced uses cases where you need to jump from one part of the tree, to a different part of the tree, and back — without loosing the context of the original path. An application of this is when we need to follow a node from a `LinkNode` (see ["Resolving link nodes"](#resolving-link-nodes) below for more details).

```ts
// Save the current path and push a new path.
stack.pushPath([rootNode, programNode, linkableNode]);

// Pop the current path and restore the previous path.
const previousPath = stack.popPath();
```

### `recordNodeStackVisitor`

The `recordNodeStackVisitor` function gives us a convenient way to record the stack of each node currently being visited. It accepts a base visitor and an empty `NodeStack` instance that will automatically be pushed and popped as the visitor traverses the nodes. This means that we can inject the `NodeStack` instance into another extension of the visitor to access the stack whilst visiting the nodes.

Note that the `recordNodeStackVisitor` **should be the last visitor** in the pipe to ensure that the stack is correctly recorded and that the current node visited is part of the stack.

For instance, here's how we can log the `NodeStack` of any base visitor as we visit the nodes.

```ts
const stack = new NodeStack();
const visitor = pipe(
    baseVisitor,
    v =>
        interceptVisitor(v, (node, next) => {
            console.log(nodePathToString(stack.getPath()));
            return next(node);
        }),
    v => recordNodeStackVisitor(v, stack),
);
```

Also note that some core visitors such as the `bottomUpTransformerVisitor` or the `getByteSizeVisitor` use a `NodeStack` internally to keep track of the current path. If you use these visitor within another visitor, you may wish to provide your own `NodeStack` instance as an option so that the same `NodeStack` is used across all visitors throughout the traversal.

```ts
const stack = new NodeStack();
const byteSizeVisitor = getByteSizeVisitor(..., { stack });

const visitor = pipe(
    voidVisitor(),
    v => tapVisitor(v, 'definedTypeNode', node => {
        const byteSize = visit(node, byteSizeVisitor);
        console.log(`The byte size of ${node.name} is ${byteSize}`);
    }),
    v => recordNodeStackVisitor(v, stack),
);
```

## Selecting nodes

When visiting a tree of nodes, it is often useful to be explicit about the paths we want to select. For instance, I may want to delete all accounts from a program node named "token".

To that end, the `NodeSelector` type represents a node selection that can take two forms:

- A `NodeSelectorFunction` of type `(path: NodePath) => boolean`. In this case, the provided function is used to determine if the last node in the provided `NodePath` should be selected.
- A `NodeSelectorPath` of type `string`. In this case, the provided string uses a simple syntax to select nodes.

The `NodeSelectorPath` syntax is as follows:

- Plain text is used to match the name of a node, if any. For instance, `token` will match any node named "token".
- Square brackets `[]` are used to match the kind of a node. For instance, `[programNode]` will match any `ProgramNode`.
- Plain text and square brackets can be combined to match both the name and the kind of a node. For instance, `[programNode]token` will match any `ProgramNode` named "token".
- Plain texts and/or square brackets can be chained using dots `.` to match several nodes in the current `NodeStack`.
- Dot-separated paths must follow the provided order but do not need to be contiguous or exhaustive. This means that `a.b.c` will match a `NodeStack` that looks like `x.a.y.b.z.c` but not `b.a.c`.
- The last item of a dot-separated path must match the last node of the `NodeStack`. For instance, `a.b` will not match `a.b.x`.
- The wildcard `*` can be used at the end of the path to match any node within the matching path. For instance, `a.b.*` will match `a.b.x`.

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

This package offers several visitors to facilitate the transformation and/or deletion of nodes. These visitors are designed to be used in conjunction with the `NodeSelector` type to select the nodes we want to transform/delete.

### `bottomUpTransformerVisitor`

The `bottomUpTransformerVisitor` traverses the nodes and intercepts them on the way back up. This means that when we reach a node, we have already visited all its children.

This visitor accepts an array of `transformers` where each transformer is an object with the following properties:

- `select`: A `NodeSelector` or an array of `NodeSelectors` used to select the nodes we want to transform. When multiple selectors are provided, they must all match for the node to be selected.
- `transform`: A function that accepts the selected node and its `NodeStack`; and returns a new node or `null` to delete the node.

Here are a few examples:

```ts
const visitor = bottomUpTransformerVisitor([
    {
        // Transform all numbers into u64 numbers.
        select: '[numberTypeNode]',
        transform: () => numberTypeNode('u64'),
    },
    {
        // Delete all account nodes that start with "m".
        select: [
            '[accountNode]',
            path => {
                const node = getLastNodeFromPath(path);
                return 'name' in node && node.name.startsWith('m');
            },
        ],
        transform: () => null,
    },
    {
        // Prefix all fields inside a defined type with "super".
        select: '[definedTypeNode]metadata.[structFieldTypeNode]',
        transform: node => structFieldTypeNode({ ...node, name: `super${pascalCase(node.name)}` }),
    },
]);
```

Additionally, `transformers` can be provided directly as functions. In this case, the function is used to transform all the nodes and further filtering may be needed inside the function.

```ts
const visitor = bottomUpTransformerVisitor([
    (node, stack) => {
        if (!isNode(node, numberTypeNode)) {
            return node;
        }
        const swappedEndian = node.endian === 'be' ? 'le' : 'be';
        return numberTypeNode(node.format, swappedEndian);
    },
]);
```

By default, this visitor will keep track of its own `NodeStack` but you may provide your own via the `stack` option in order to share the same `NodeStack` across multiple visitors.

### `topDownTransformerVisitor`

The `topDownTransformerVisitor` works the same way as the `bottomUpTransformerVisitor` but intercepts the nodes on the way down. This means that when we reach a node, we have not yet visited its children.

```ts
const visitor = topDownTransformerVisitor([
    {
        // Half the amount of all accounts and instructions in programs.
        // The other half won't be visited on the way down.
        select: '[programNode]',
        transform: node =>
            programNode({
                ...node,
                accounts: node.accounts.slice(0, Math.floor(node.accounts.length / 2)),
                instructions: node.instructions.slice(0, Math.floor(node.instructions.length / 2)),
            }),
    },
]);
```

Here as well, you may use the `stack` option to provide your own `NodeStack` instance.

### `deleteNodesVisitor`

The `deleteNodesVisitor` accepts an array of `NodeSelectors` and deletes all the nodes that match any of the provided selectors. Therefore, it is equivalent to using a transformer visitor such that the `transform` function returns `null` for the selected nodes.

```ts
// Deletes all account nodes named "mint" and all number type nodes.
const visitor = deleteNodesVisitor(['[accountNode]mint', '[numberTypeNode]']);
```

Here as well, you may use the `stack` option to provide your own `NodeStack` instance.

## String representations

This package also offers visitors that help render nodes as strings. These visitors can be useful for debugging purposes as well as getting a unique hash string representation of a node.

### `getDebugStringVisitor`

The `getDebugStringVisitor` provides a string representation of the nodes that can be used for debugging purposes. By default, it inlines the content of the nodes and does not include any indentation.

```ts
const visitor = getDebugStringVisitor();
const result = visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ "tupleTypeNode(numberTypeNode[u32], publicKeyTypeNode)"
```

However, you can provide the `indent` option to get a more readable string representation.

```ts
const visitor = getDebugStringVisitor({ indent: true });
const result = visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// tupleTypeNode
// |   numberTypeNode [u32]
// |   publicKeyTypeNode
```

Note that this string does not always include every piece of information a node has to offer. Therefore, it cannot be used as a unique identifier for the content of a node. For that purpose, see the `getUniqueHashStringVisitor` below.

### `getUniqueHashStringVisitor`

The `getUniqueHashStringVisitor` provides a unique string representation of the node that can be used to get a unique hash for that node. In other words, if two different nodes have the exact same content, they will output the same string.

```ts
const visitor = getUniqueHashStringVisitor();
const result = visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ '{"items":[{"endian":"le","format":"u32","kind":"numberTypeNode"},{"kind":"publicKeyTypeNode"}],"kind":"tupleTypeNode"}'
```

### `consoleLogVisitor`

The `consoleLogVisitor` accepts any `Visitor<string>` and transforms it into a `Visitor<void>` such that the provided `string` is logged to the console.

```ts
// Outputs the indented debug string to the console.
const visitor = consoleLogVisitor(getDebugStringVisitor({ indent: true }));
```

## Resolving link nodes

### `LinkableDictionary`

The `LinkableDictionary` type is a utility that allows us to store and access linkable nodes — such as `ProgramNodes`, `AccountNodes` or `PdaNodes` — from their respective [link nodes](../nodes/linkNodes/README.md).

It offers the following API:

```ts
const linkables = new LinkableDictionary();

// Record linkable nodes via their full path.
linkables.recordPath([rootNode, programNode, accountNode]);

// Get a linkable node using the full path of a link node, or return undefined if it is not found.
const programNode: ProgramNode | undefined = linkables.get([...somePath, programLinkNode]);

// Get a linkable node using the full path of a link node, or throw an error if it is not found.
const programNode: ProgramNode = linkables.getOrThrow([...somePath, programLinkNode]);

// Get the path of a linkable node using the full path of a link node, or return undefined if it is not found.
const accountPath: NodePath<AccountNode> | undefined = linkables.getPath([...somePath, accountLinkNode]);

// Get the path of a linkable node using the full path of a link node, or throw an error if it is not found.
const accountPath: NodePath<AccountNode> = linkables.getPathOrThrow([...somePath, accountLinkNode]);
```

Note that:

- The path of the recorded node must be provided when recording a linkable node.
- The path of the link node must be provided when getting a linkable node (or its path) from it.

This API may be used with the `recordLinkablesOnFirstVisitVisitor` to record the linkable nodes before the first node visit; as well as the `recordNodeStackVisitor` to keep track of the current node path when accessing the linkable nodes.

### `getRecordLinkablesVisitor`

This visitor accepts a `LinkableDictionary` instance and records all linkable nodes it encounters when visiting the nodes.

```ts
const linkables = new LinkableDictionary();
visit(rootNode, getRecordLinkablesVisitor(linkables));
// Now, all linkable nodes are recorded in the `linkables` dictionary.
```

### `recordLinkablesOnFirstVisitVisitor`

This visitor is a utility that combines `interceptFirstVisitVisitor` and `getRecordLinkablesVisitor` to record all linkable nodes before the first visit of any node.

It accepts a base visitor and a `LinkableDictionary` instance; and returns a new visitor that records all linkable nodes it encounters before the very first visit of the provided base visitor. This means that we can inject the `LinkableDictionary` instance into other extensions of the base visitor to resolve any link node we encounter.

Note that the `recordLinkablesOnFirstVisitVisitor` **should be the last visitor** in the pipe to ensure that all linkable nodes are recorded before being used.

Here's an example that records a `LinkableDictionary` and uses it to log the amount of seeds in each linked PDA node.

```ts
const linkables = new LinkableDictionary();
const stack = new NodeStack();
const visitor = pipe(
    baseVisitor,
    v =>
        tapVisitor(v, 'pdaLinkNode', node => {
            const pdaNode = linkables.getOrThrow(stack.getPath(node.kind));
            console.log(`${pdaNode.seeds.length} seeds`);
        }),
    v => recordNodeStackVisitor(v, stack),
    v => recordLinkablesOnFirstVisitVisitor(v, linkables),
);
```

## Other useful visitors

This package provides a few other visitors that may help build more complex visitors.

### `getByteSizeVisitor`

The `getByteSizeVisitor` calculates the byte size of a given `TypeNode`. It returns a `number` if the byte size is fixed or `null` if it is variable. It requires a `LinkableDictionary` instance to resolve any link nodes it encounters.

```ts
const visitor = getByteSizeVisitor(linkables);
const size = visit(tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ 36 (4 bytes for the u32 number and 32 bytes for the public key)
```

By default, this visitor will keep track of its own `NodeStack` but you may provide your own via the `stack` option in order to share the same `NodeStack` across multiple visitors.

### `getResolvedInstructionInputsVisitor`

The `getResolvedInstructionInputsVisitor` visits `InstructionNodes` only and returns an array of instruction accounts and arguments in the order they should be rendered for their default values to be resolved.

For instance, say we have an instruction with two accounts and one argument such that `argumentA` defaults to `accountB` and `accountA` is a PDA that uses `argumentA` as a seed. Therefore, the visitor will return an array in the order `[accountB, argumentA, accountA]`.

This is mostly useful when rendering client code for instructions.

### `removeDocsVisitor`

The `removeDocsVisitor` goes through all nodes that have a `docs` property and clears its content.

```ts
const node = definedTypeNode({
    name: 'authority',
    type: publicKeyTypeNode(),
    docs: ['The authority of the account'],
});
const updatedNode = visit(node, removeDocsVisitor());
// ^ definedTypeNode({ name: 'authority', type: publicKeyTypeNode() })
```

This is used internally by the `getUniqueHashStringVisitor` to get a unique identifier for a node regardless of its documentation.
