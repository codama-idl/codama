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

The definition of the `Visitor` type is an object such that, for each supported node kind, a function that accepts a node of that kind and returns a value of type `T` is defined. The name of the function must be camel-cased, start with `visit` and finish with the name of the node kind without the `Node` suffix. For instance, the function for the `programNode` kind is named `visitProgram`. The `getVisitFunctionName` helper returns that name for any node kind.

```ts
getVisitFunctionName('structFieldTypeNode');
// ^ "visitStructFieldType"
```

### Writing your own visitor

To write a custom visitor, you may simply define an object with the appropriate functions. For instance, here's a visitor that only visits `ProgramNodes` and returns the number of accounts in the program.

```ts
const accountCounterVisitor: Visitor<number, 'programNode'> = {
    visitProgram: (node: ProgramNode) => (node.accounts ?? []).length,
};
```

Note that optional arrays such as `accounts` are omitted from nodes when empty, hence the `?? []`.

It is recommended to return visitors from functions so we can easily reuse them and parameterise them. Additionally, this allows our code to be tree-shaken by the bundler. As we will see in this documentation, all provided visitors are returned from functions even if they don't take any parameter.

Here's our previous example updated to accept a `multiplier` parameter.

```ts
const accountCounterVisitor = (multiplier = 1): Visitor<number, 'programNode'> => ({
    visitProgram: (node: ProgramNode) => (node.accounts ?? []).length * multiplier,
});
```

In practice, writing a visitor manually can be cumbersome as a function must be provided for each supported node kind. Therefore, it is recommended to compose visitors from a set of core visitors provided by this package and extend them to suit your needs. We will see how to do this in the next sections.

### Visiting nodes

Once we have a visitor, we can visit any node it supports by calling the `visit` function. This function accepts a node and a visitor of type `Visitor<T>` and returns a type `T`.

```ts
const counter: number = visit(programNode, accountCounterVisitor());
```

The `visitOrElse` function can also be used to gracefully handle the case where the node is not supported by the visitor. In this case, the fallback function provided as a third argument is used to compute the result.

```ts
const counter: number = visitOrElse(stringTypeNode('utf8'), accountCounterVisitor(), () => 0);
// ^ 0
```

Also note that, if you are using [the `Codama` interface](../library/README.md#codama), which is a simple wrapper around a `RootNode`, you may visit that root node using the provided helpers:

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

Before we list each available core visitor, it is important to know that each of these functions optionally accepts an array of node kinds **as a `keys` attribute in their `options`**. This allows us to restrict the visitor to a specific set of nodes and will return a `Visitor<T, U>` instance where `U` is the union of the provided node kinds. The node kind arrays exported by `@codama/nodes`, such as `TYPE_NODE_KINDS` or `REGISTERED_NODE_KINDS`, can be used here.

Here are some examples:

```ts
// This visitor only accepts `ProgramNodes`.
const visitor: Visitor<void, 'programNode'> = voidVisitor({ keys: ['programNode'] });

// This visitor accepts both `IntegerTypeNodes` and `StringTypeNodes`.
const visitor: Visitor<void, 'integerTypeNode' | 'stringTypeNode'> = voidVisitor({
    keys: ['integerTypeNode', 'stringTypeNode'],
});

// This visitor accepts all type nodes.
const visitor: Visitor<void, TypeNode['kind']> = voidVisitor({ keys: TYPE_NODE_KINDS });

// This visitor accepts all nodes.
const visitor: Visitor<void> = voidVisitor();
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
const kind = visit(integerTypeNode('u32'), visitor);
// ^ "Visiting integerTypeNode"
```

This visitor can be used to create simple visitors where each node shares a similar logic or to provide a starting point for more complex visitors.

### `identityVisitor`

The `identityVisitor` traverses the nodes and returns a deep copy of the visited node.

```ts
const node = visit(integerTypeNode('u32'), identityVisitor());
// ^ A different instance of integerTypeNode('u32')
```

Note that the returned visitor is of type `Visitor<Node | null>` meaning this visitor allows for nodes to be deleted, i.e. marked as `null`. The `identityVisitor` can resolve nested `null` references depending on the node kind. For instance, if a `tupleTypeNode` contains two items and the first one is `null` after having visited its children, then the `tupleTypeNode` will only contain the second item. It is also possible for a nested `null` reference to bubble up if it cannot be resolved, e.g. when a required child is deleted.

Here are some examples of this behaviour by overriding the `visitPublicKeyType` function to return `null`.

```ts
const visitor = identityVisitor();
visitor.visitPublicKeyType = () => null;

const node = visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ tupleTypeNode([integerTypeNode('u32')])

const node = visit(definedTypeNode({ identifier: 'address', type: publicKeyTypeNode() }), visitor);
// ^ null
```

Also note that, because the visitor is of type `Node | null`, it is technically possible to extend it such that a node of a different kind is returned.

```ts
const visitor = identityVisitor();
visitor.visitPublicKeyType = () => addTypeNodeTransforms(stringTypeNode('base58'), [fixedSizeTransformNode(32)]);
```

### `nonNullableIdentityVisitor`

The `nonNullableIdentityVisitor` works the same way as the `identityVisitor` but it does not allow nodes to be deleted. That is, its return type must be a `Node` and not `Node | null`.

```ts
const node = visit(integerTypeNode('u32'), nonNullableIdentityVisitor());
// ^ A different instance of integerTypeNode('u32')
```

### `mergeVisitor`

The `mergeVisitor` returns a `Visitor<T>` by accepting two functions such that:

- The first function is used on the leaves of the Codama IDL and returns a type `T`.
- The second function is used to merge the values `T[]` of the children of a node and aggregate them into a type `T`.

Note that, since every node may carry children such as `plugins` or `transforms`, the merge function is also called on nodes that have no children, with an empty array of values.

For instance, here is how we can use the `mergeVisitor` to create a nested string representation of node kinds.

```ts
const visitor = mergeVisitor(
    (node): string => node.kind,
    (node, values: string[]): string => (values.length > 0 ? `${node.kind}(${values.join(',')})` : node.kind),
);

const result = visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ "tupleTypeNode(integerTypeNode,publicKeyTypeNode)"
```

Here's another example, counting the number of traversed nodes.

```ts
const visitor = mergeVisitor(
    () => 1,
    (_, values) => values.reduce((a, b) => a + b, 1),
);

const result = visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ 3
```

The `mergeVisitor` is a powerful starting point to create aggregating visitors.

## Composing visitors

The following visitor functions accept an existing visitor and return a new visitor that extends or modifies the behaviour of the provided visitor. These primitives can be used to create complex visitors by composing simpler ones.

### `extendVisitor`

The `extendVisitor` function accepts a base visitor and a set of function wrappers that are used to extend the behaviour of the base visitor.

Each function wrapper is given the `node` being visited and an object composed of two elements:

- `next`: A function that can be called to delegate to the base visitor, e.g. `next(node)`.
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

const result = visit(tupleTypeNode([publicKeyTypeNode(), integerTypeNode('u32')]), visitor);
// ^ 13
```

Notice how `next(node)` can be used to access the underlying visitor meaning we can extend both the input and the output of the base visitor.

Another example is to make use of the `self` property to recursively call the extended visitor. For instance, the following code only visits the first item of tuple types.

```ts
const visitor = extendVisitor(baseVisitor, {
    visitTupleType: (node, { self }) => visit((node.items ?? [])[0], self) + 1,
});

const result = visit(tupleTypeNode([tupleTypeNode([publicKeyTypeNode()]), integerTypeNode('u32')]), visitor);
// ^ 3
```

Overriding a function that the base visitor does not define throws a `CODAMA_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION` error.

### `interceptVisitor`

The `interceptVisitor` allows us to wrap every visiting function of a provided visitor into a given function. This function has access to the node being visited, a `next` function that can be called to delegate to the base visitor and, as a third argument, the visitor itself (`self`).

For instance, the following visitor intercepts a `voidVisitor` and captures events when visiting nodes.

```ts
const events: string[] = [];
const visitor = interceptVisitor(voidVisitor(), (node, next) => {
    events.push(`down:${node.kind}`);
    next(node);
    events.push(`up:${node.kind}`);
});

visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// events === [
//     'down:tupleTypeNode',
//     'down:integerTypeNode',
//     'up:integerTypeNode',
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

visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// events === [
//     'down:tupleTypeNode',
//     'up:tupleTypeNode',
// ]
```

### `tapVisitor`

The `tapVisitor` function allows us to tap into the visiting functions of a provided visitor without modifying its behaviour. This means the returned visitor will behave exactly like the base visitor except that the provided function will be called for the specified node kind.

Note that the provided function must not return a value as it is only used for side effects.

```ts
let numberOfIntegerNodes = 0;
const visitor = tapVisitor(voidVisitor(), 'integerTypeNode', () => {
    numberOfIntegerNodes++;
});

visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// numberOfIntegerNodes === 1
```

### `mapVisitor`

The `mapVisitor` function accepts a base visitor of type `Visitor<T>` and a function of type `(value: T, node: Node) => U`; and returns a new visitor of type `Visitor<U>`. The function receives the value returned by the base visitor and the visited node.

```ts
// Gets a nested string representation of node kinds.
const baseVisitor = mergeVisitor(
    (node): string => node.kind,
    (node, values) => (values.length > 0 ? `${node.kind}(${values.join(',')})` : node.kind),
);

// Counts the number of characters in the string representation.
const visitor = mapVisitor(baseVisitor, (value: string): number => value.length);

const result = visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ 48
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

- Transforms all integer types into `u64` integers.
- Logs the amount of items in tuple types.
- Wraps the visited type node, but not its children, in a `DefinedTypeNode` labelled "gift".

```ts
const visitor = pipe(
    // Starts with the identity visitor.
    identityVisitor(),
    v =>
        // Extends the visitor to make all integer types u64.
        extendVisitor(v, {
            visitIntegerType: () => integerTypeNode('u64'),
        }),
    v =>
        // Log the amount of items in tuple types.
        tapVisitor(v, 'tupleTypeNode', node => {
            console.log((node.items ?? []).length);
        }),
    v =>
        // Wrap the visited type node in a `DefinedTypeNode` labelled "gift".
        interceptFirstVisitVisitor(v, (node, next) => {
            const result = next(node);
            if (!isNode(result, TYPE_NODE_KINDS)) return result;
            return definedTypeNode({ identifier: 'gift', type: result });
        }),
);

const result = visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// Logs 2.
// ^ definedTypeNode({ identifier: 'gift', type: tupleTypeNode([integerTypeNode('u64'), publicKeyTypeNode()]) })
```

### `singleNodeVisitor`

The `singleNodeVisitor` function is a simple primitive that creates a `Visitor` that only visits a single node kind. It accepts a node kind and a function that is used to visit that node kind. Any other node kind will not be supported by the visitor.

```ts
const visitor = singleNodeVisitor('tupleTypeNode', node => (node.items ?? []).length);

const result = visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
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

The `NodePath` type defines an immutable array of `Nodes` that represents any path of nodes in the Codama IDL, from the root to a node included. It accepts an optional type parameter that tells us the type of the last node in the path. For instance `NodePath<IntegerTypeNode>` represents a path of nodes ending with an `IntegerTypeNode`.

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
const program: ProgramNode | undefined = findProgramNodeFromPath(path);
const instruction: InstructionNode | undefined = findInstructionNodeFromPath(path);

// Get the subpath of a path from the beginning to the last node matching a specific kind, if any.
const subpath: NodePath<ProgramNode> | undefined = getNodePathUntilLastNode(path, 'programNode');
// ^ [rootNode, programNode]

// Check that a path is not empty.
const anyPath: NodePath = [rootNode, programNode, accountNode];
if (isFilledNodePath(anyPath)) {
    anyPath satisfies NodePath<Node>;
}

// Check that a path finishes with a node matching the provided kind or kinds.
if (isNodePath(anyPath, ['accountNode', 'instructionNode'])) {
    anyPath satisfies NodePath<AccountNode | InstructionNode>;
}

// Assert that a path finishes with a node matching the provided kind or kinds.
assertIsNodePath(anyPath, ['accountNode', 'instructionNode']);
anyPath satisfies NodePath<AccountNode | InstructionNode>;
```

To display a path as a string, the way error messages render it, use `getNodePathString` from `@codama/errors`. A leading root node is left out.

```ts
import { getNodePathString } from '@codama/errors';

getNodePathString(path); // -> "[programNode]token.[accountNode]mint"
```

### `NodeStack`

The `NodeStack` class is a utility that allows us to record the path of nodes that led to the node being currently visited. It is essentially a mutable version of `NodePath` that pushes and pops `Nodes` as we go down and up the tree of nodes.

For instance, consider the following node:

```ts
const integer = integerTypeNode('u32');
const tuple = tupleTypeNode([integer, publicKeyTypeNode()]);
const node = definedTypeNode({ identifier: 'myType', type: tuple });
```

In this example, the `integerTypeNode` can be reached using the following stack:

```ts
const stack = new NodeStack();
stack.push(node); // -> definedTypeNode.
stack.push(tuple); // -> tupleTypeNode.
stack.push(integer); // -> integerTypeNode.
```

Once you have access to a `NodeStack` instance, you may use the following methods:

```ts
// Create a stack whose current path is the given path.
const nodeStack = new NodeStack([rootNode, programNode]);

// Push a node to the stack.
nodeStack.push(accountNode);

// Peek at the last node in the stack.
const lastNode = nodeStack.peek();

// Get all the nodes in the stack as an immutable `NodePath` array.
const path: NodePath = nodeStack.getPath();

// Get a `NodePath` whilst asserting on the last node kind.
const accountPath: NodePath<AccountNode> = nodeStack.getPath('accountNode');

// Pop the last node out of the stack.
const poppedNode = nodeStack.pop();

// Check if the stack is empty.
const isEmpty = nodeStack.isEmpty();

// Clone the stack.
const clonedStack = nodeStack.clone();

// Render the current path as a string, like `getNodePathString`.
const pathString = nodeStack.toString();
```

Additionally, it is possible to save and restore multiple node paths within a `NodeStack` by using the `pushPath` and `popPath` methods. This is for more advanced use cases where you need to jump from one part of the tree to a different part of the tree, and back, without losing the context of the original path. An application of this is when we need to follow a node from a `LinkNode` (see ["Resolving link nodes"](#resolving-link-nodes) below for more details).

```ts
// Save the current path and push a new path.
stack.pushPath([rootNode, programNode, definedType]);

// Pop the current path and restore the previous path.
const previousPath = stack.popPath();
```

Prefer the `withPath` and `visitPath` helpers, which restore the previous path even if an error is thrown. `withPath` runs a callback with the given path as the current path, whereas `visitPath` visits the last node of the given path using the rest of that path as the current path. Since `visitPath` relies on the visitor to record the visited node, the visitor must record its nodes on the same stack (e.g. using `recordNodeStackVisitor`). Otherwise, use `withPath` instead.

```ts
// Run a callback with another path as the current path.
const fields = stack.withPath([rootNode, programNode, definedType], () => getFields(definedType.type));

// Visit a linked node with its own path as the current path.
const linkedPath = linkables.getPathOrThrow(stack.getPath('definedTypeLinkNode'));
const result = stack.visitPath(linkedPath, visitor);
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
            console.log(stack.toString());
            return next(node);
        }),
    v => recordNodeStackVisitor(v, stack),
);
```

Also note that some core visitors such as the `bottomUpTransformerVisitor` or the `getByteSizeVisitor` use a `NodeStack` internally to keep track of the current path. If you use these visitors within another visitor, you may wish to provide your own `NodeStack` instance as an option so that the same `NodeStack` is used across all visitors throughout the traversal.

```ts
const stack = new NodeStack();
const byteSizeVisitor = getByteSizeVisitor(linkables, { stack });

const visitor = pipe(
    voidVisitor(),
    v =>
        tapVisitor(v, 'definedTypeNode', node => {
            const byteSize = visit(node, byteSizeVisitor);
            console.log(`The byte size of ${node.identifier} is ${byteSize}`);
        }),
    v => recordNodeStackVisitor(v, stack),
);
```

## Selecting nodes

When visiting a tree of nodes, it is often useful to be explicit about the paths we want to select. For instance, I may want to delete all accounts from a program node named "token".

To that end, the `NodeSelector` type represents a node selection that can take two forms:

- A `NodeSelectorFunction` of type `(path: NodePath<Node>) => boolean`. In this case, the provided function is used to determine if the last node in the provided `NodePath` should be selected.
- A `NodeSelectorPath` of type `string`. In this case, the provided string uses a simple syntax to select nodes.

The `NodeSelectorPath` syntax is as follows:

- Plain text is used to match the identifier of a node, if any. For instance, `token` will match any node whose identifier is "token".
- Square brackets `[]` are used to match the kind of a node. For instance, `[programNode]` will match any `ProgramNode`. Several kinds can be separated by a pipe `|`, e.g. `[accountNode|instructionNode]`.
- Plain text and square brackets can be combined to match both the identifier and the kind of a node. For instance, `[programNode]token` will match any `ProgramNode` whose identifier is "token".
- The wildcard `*` matches any node.
- Selectors can be chained using dots `.` to match several nodes in the current `NodePath`.
- Dot-separated paths must follow the provided order but do not need to be contiguous or exhaustive. This means that `a.b.c` will match a path that looks like `x.a.y.b.z.c` but not `b.a.c`.
- The last item of a dot-separated path must match the last node of the path. For instance, `a.b` will not match `a.b.x` but `a.b.*` will.

Here are some examples:

```ts
'[accountNode]';
// Matches any `AccountNode`.

'mint';
// Matches any node whose identifier is "mint".

'[accountNode]mint';
// Matches any `AccountNode` whose identifier is "mint".

'[programNode]token.[accountNode]mint';
// Matches any `AccountNode` named "mint" within a `ProgramNode` named "token".

'[programNode]token.*';
// Matches any node within a `ProgramNode` named "token" (excluding the program node itself).

'token.[structTypeNode].amount';
// Matches any node named "amount" within a `StructTypeNode` within any node named "token".
```

The `NodeSelector` type is used by various visitors such as the `bottomUpTransformerVisitor` or the `deleteNodesVisitor` to help us select the nodes we want to transform or delete. If you need to evaluate selectors yourself, `getNodeSelectorFunction` turns any `NodeSelector` into a `NodeSelectorFunction`, and `getConjunctiveNodeSelectorFunction` does the same for an array of selectors that must all match.

```ts
const isMintAccount = getNodeSelectorFunction('[programNode]token.[accountNode]mint');
isMintAccount([rootNode, programNode, accountNode]); // -> true
```

## Transforming nodes

This package offers several visitors to facilitate the transformation and/or deletion of nodes. These visitors are designed to be used in conjunction with the `NodeSelector` type to select the nodes we want to transform/delete.

### `bottomUpTransformerVisitor`

The `bottomUpTransformerVisitor` traverses the nodes and intercepts them on the way back up. This means that when we reach a node, we have already visited all its children.

This visitor accepts an array of `transformers` where each transformer is an object with the following properties:

- `select`: A `NodeSelector` or an array of `NodeSelectors` used to select the nodes we want to transform. When multiple selectors are provided, they must all match for the node to be selected.
- `transform`: A function that accepts the selected node and the `NodeStack`; and returns a new node or `null` to delete the node.

Here are a few examples:

```ts
const visitor = bottomUpTransformerVisitor([
    {
        // Transform all integers into u64 integers.
        select: '[integerTypeNode]',
        transform: () => integerTypeNode('u64'),
    },
    {
        // Delete all account nodes of the "token" program that start with "m".
        select: [
            '[programNode]token.*',
            path => {
                const node = getLastNodeFromPath(path);
                return isNode(node, 'accountNode') && node.identifier.startsWith('m');
            },
        ],
        transform: () => null,
    },
    {
        // Prefix all fields inside a defined type with "super".
        select: '[definedTypeNode]metadata.[structFieldTypeNode]',
        transform: node => {
            assertIsNode(node, 'structFieldTypeNode');
            return structFieldTypeNode({ ...node, identifier: `super${pascalCase(node.identifier)}` });
        },
    },
]);
```

Additionally, `transformers` can be provided directly as functions. In this case, the function is used to transform all the nodes and further filtering may be needed inside the function.

```ts
const visitor = bottomUpTransformerVisitor([
    node => {
        if (!isNode(node, 'integerTypeNode')) {
            return node;
        }
        const swappedEndian = node.endian === 'be' ? 'le' : 'be';
        return integerTypeNode(node.format, { endian: swappedEndian });
    },
]);
```

By default, this visitor will keep track of its own `NodeStack` but you may provide your own via the `stack` option in order to share the same `NodeStack` across multiple visitors.

### `topDownTransformerVisitor`

The `topDownTransformerVisitor` works the same way as the `bottomUpTransformerVisitor` but intercepts the nodes on the way down. This means that when we reach a node, we have not yet visited its children.

```ts
const visitor = topDownTransformerVisitor([
    {
        // Halve the amount of accounts and instructions in programs.
        // The other half won't be visited on the way down.
        select: '[programNode]',
        transform: node => {
            assertIsNode(node, 'programNode');
            const accounts = node.accounts ?? [];
            const instructions = node.instructions ?? [];
            return programNode({
                ...node,
                accounts: accounts.slice(0, Math.floor(accounts.length / 2)),
                instructions: instructions.slice(0, Math.floor(instructions.length / 2)),
            }) as typeof node;
        },
    },
]);
```

Here as well, you may use the `stack` option to provide your own `NodeStack` instance.

### `deleteNodesVisitor`

The `deleteNodesVisitor` accepts an array of `NodeSelectors` and deletes all the nodes that match any of the provided selectors. Therefore, it is equivalent to using a `topDownTransformerVisitor` such that the `transform` function returns `null` for the selected nodes.

```ts
// Deletes all account nodes named "mint" and all integer type nodes.
const visitor = deleteNodesVisitor(['[accountNode]mint', '[integerTypeNode]']);
```

Here as well, you may use the `stack` option to provide your own `NodeStack` instance.

## String representations

This package also offers visitors that help render nodes as strings. These visitors can be useful for debugging purposes as well as getting a unique hash string representation of a node.

### `getDebugStringVisitor`

The `getDebugStringVisitor` provides a string representation of the nodes that can be used for debugging purposes. By default, it inlines the content of the nodes and does not include any indentation.

```ts
const visitor = getDebugStringVisitor();
const result = visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ "tupleTypeNode(integerTypeNode[u32], publicKeyTypeNode)"
```

However, you can provide the `indent` option to get a more readable string representation. The `indentSeparator` option, which defaults to `"|   "`, customises the indentation.

```ts
const visitor = getDebugStringVisitor({ indent: true });
const result = visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// tupleTypeNode
// |   integerTypeNode [u32]
// |   publicKeyTypeNode
```

Note that this string does not always include every piece of information a node has to offer. Therefore, it cannot be used as a unique identifier for the content of a node. For that purpose, see the `getUniqueHashStringVisitor` below.

### `getUniqueHashStringVisitor`

The `getUniqueHashStringVisitor` provides a unique string representation of the node that can be used to get a unique hash for that node. In other words, if two different nodes have the exact same content, they will output the same string.

```ts
const visitor = getUniqueHashStringVisitor();
const result = visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ '{"items":[{"endian":"le","format":"u32","kind":"integerTypeNode"},{"kind":"publicKeyTypeNode"}],"kind":"tupleTypeNode"}'
```

Use the `removeDocs` option to ignore documentation, so nodes only differing by their docs output the same string.

```ts
const visitor = getUniqueHashStringVisitor({ removeDocs: true });
```

### `consoleLogVisitor`

The `consoleLogVisitor` accepts any `Visitor<string>` and transforms it into a `Visitor<void>` such that the provided `string` is logged to the console.

```ts
// Outputs the indented debug string to the console.
const visitor = consoleLogVisitor(getDebugStringVisitor({ indent: true }));
```

## Resolving link nodes

### `LinkableDictionary`

The `LinkableDictionary` type is a utility that allows us to store and access linkable nodes from their respective link nodes, e.g. a `DefinedTypeNode` from a `DefinedTypeLinkNode`. Linkable nodes are `ProgramNodes`, `AccountNodes`, `DefinedTypeNodes`, `PdaNodes`, `InstructionNodes` and `InstructionAccountNodes`.

It offers the following API:

```ts
const linkables = new LinkableDictionary();

// Record linkable nodes via their full path.
linkables.recordPath([rootNode, programNode, accountNode]);

// Check whether the linkable node of a link node was recorded.
const hasProgram: boolean = linkables.has([...somePath, programLinkNode]);

// Get a linkable node using the full path of a link node, or return undefined if it is not found.
const program: ProgramNode | undefined = linkables.get([...somePath, programLinkNode]);

// Get a linkable node using the full path of a link node, or throw an error if it is not found.
const program: ProgramNode = linkables.getOrThrow([...somePath, programLinkNode]);

// Get the path of a linkable node using the full path of a link node, or return undefined if it is not found.
const accountPath: NodePath<AccountNode> | undefined = linkables.getPath([...somePath, accountLinkNode]);

// Get the path of a linkable node using the full path of a link node, or throw an error if it is not found.
const accountPath: NodePath<AccountNode> = linkables.getPathOrThrow([...somePath, accountLinkNode]);

// List the paths of every recorded linkable node of a given kind, across all programs.
const accountPaths: NodePath<AccountNode>[] = linkables.getRecordedPathsOfKind('accountNode');

// Forget every recorded linkable node, e.g. before recording the linkable nodes of another tree.
linkables.clear();
```

Note that:

- The path of the recorded node must be provided when recording a linkable node. Nodes outside of a program are not recorded.
- The path of the link node must be provided when getting a linkable node (or its path) from it. Links without an explicit `program` are resolved from the closest program of that path.
- `getOrThrow` and `getPathOrThrow` throw a `CODAMA_ERROR__LINKED_NODE_NOT_FOUND` error when the linked node is not found.

This API may be used with the `recordLinkablesOnFirstVisitVisitor` to record the linkable nodes before the first node visit; as well as the `recordNodeStackVisitor` to keep track of the current node path when accessing the linkable nodes.

### `getLinkablesFromNode`

Records the linkable nodes of the tree under the given node, e.g. a root node, into a new `LinkableDictionary`. Entry points use it once, then pass the dictionary to the functions they compose.

```ts
const linkables = getLinkablesFromNode(rootNode);
```

### `getRecordLinkablesVisitor`

This visitor accepts a `LinkableDictionary` instance and records all linkable nodes it encounters when visiting the nodes.

```ts
const linkables = new LinkableDictionary();
visit(rootNode, getRecordLinkablesVisitor(linkables));
// Now, all linkable nodes are recorded in the `linkables` dictionary, as `getLinkablesFromNode(rootNode)` does.
```

### `recordLinkablesOnFirstVisitVisitor`

This visitor is a utility that combines `interceptFirstVisitVisitor` and `getRecordLinkablesVisitor` to record all linkable nodes before the first visit of any node.

It accepts a base visitor and a `LinkableDictionary` instance; and returns a new visitor that records all linkable nodes it encounters before the very first visit of the provided base visitor. This means that we can inject the `LinkableDictionary` instance into other extensions of the base visitor to resolve any link node we encounter. The dictionary is cleared before each top-level visit, so a visitor reused on several trees only resolves links against the tree it is currently visiting.

Note that the `recordLinkablesOnFirstVisitVisitor` **should be the last visitor** in the pipe to ensure that all linkable nodes are recorded before being used.

Here's an example that records a `LinkableDictionary` and uses it to log the amount of seeds in each linked PDA node.

```ts
const linkables = new LinkableDictionary();
const stack = new NodeStack();
const visitor = pipe(
    voidVisitor(),
    v =>
        tapVisitor(v, 'pdaLinkNode', node => {
            const pdaNode = linkables.getOrThrow(stack.getPath(node.kind));
            console.log(`${(pdaNode.seeds ?? []).length} seeds`);
        }),
    v => recordNodeStackVisitor(v, stack),
    v => recordLinkablesOnFirstVisitVisitor(v, linkables),
);
```

## Resolving path expressions

Some nodes point into nested data using a path expression, such as a `dataValueNode('config.fees[0]')` or a `fieldDiscriminatorNode('header.kind')`. A path is made of segments where `.identifier` selects a struct field and `[n]` selects the n-th item of a tuple, or the item of an array or set.

### `resolveTypePath`

The `resolveTypePath` function follows a path expression from a source type and returns the full `NodePath` of the node it points to. The source is a `TypePath`, i.e. a path ending with any type node, struct field, enum variant or `definedTypeLinkNode`. It requires a `LinkableDictionary` to follow links along the way.

```ts
// Given instruction data such as `struct { config: link(config) }`
// where the `config` defined type is `struct { fees: array(u16) }`.
const source: TypePath = [root, program, instruction, instructionData];
const path = resolveTypePath(source, pathString('config.fees[0]'), linkables);
// ^ [root, program, configType, configStruct, feesField, feesArray, u16]

const node = getLastNodeFromPath(path);
// ^ integerTypeNode('u16')
```

Note that:

- Links are followed through the path of their definitions, so any further links resolve in the program that defines them. Here, the returned path goes through `configType` rather than the instruction.
- The last node is returned as addressed. For instance, resolving `config` above returns the struct field whose type is the link, without following it.
- Indices into arrays and sets are not checked against their count, as they select the item type.
- If a segment cannot be followed, a `CODAMA_ERROR__CANNOT_RESOLVE_PATH` error is thrown, naming the segment and the path of the node it was applied to. Dangling links throw a `CODAMA_ERROR__LINKED_NODE_NOT_FOUND` error.

With the `followAccountLinks` option, a `.data` segment applied to a public key whose type carries an `accountLink` continues into the data of the linked account. For instance, `mint.data.decimals` resolves to the `decimals` field of the account the `mint` field links to.

```ts
// Given a `mint: publicKey` field linking to a `mint` account whose data is `struct { decimals: u8 }`.
resolveTypePath(source, pathString('mint.data.decimals'), linkables, { followAccountLinks: true });
// ^ [root, program, mintAccount, mintStruct, decimalsField]
```

The `parsePath` helper splits a path expression into its segments.

```ts
parsePath('config.fees[0]');
// ^ [{ kind: 'field', identifier: 'config' }, { kind: 'field', identifier: 'fees' }, { kind: 'index', index: 0 }]
```

### `getInstructionDataFields`

The `getInstructionDataFields` helper lists every struct field addressable within the `data` of an instruction, with its full path, following `definedTypeLinkNodes`. The instruction path must contain its program for linked data to be followed.

```ts
// data: struct { amount: u64, config: struct { fee: u16 } }
getInstructionDataFields([root, program, instruction], linkables).map(({ path }) => path);
// ^ ['amount', 'config', 'config.fee']
```

## Resolving injected values

Instructions may provide values to the nodes they contain through their `provides` attribute, which `injectedValueNodes` consume by key.

### `ProvidedScope`

The `ProvidedScope` class holds the `providedNodes` visible at a point of the tree, as a stack of frames where each instruction contributes one frame. Resolution is lexical: the innermost frame providing a key wins and outer frames remain visible.

```ts
const scope = new ProvidedScope([providedNode('decimals', integerValueNode('6'))]);

// Resolve every injection within a node, or return undefined if one is not provided.
scope.resolve(injectedValueNode({ key: 'decimals' }), { kinds: ['integerValueNode'] });
// ^ integerValueNode('6')

// Same, but throw a `CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED` error instead of returning undefined.
scope.resolveOrThrow(injectedValueNode({ key: 'decimals' }), { kinds: ['integerValueNode'] });

// Get the innermost provider of a key, open and close frames, or clone the scope.
scope.get(identifierString('decimals'));
scope.push([providedNode('authority', accountValueNode('owner'))]);
scope.pop();
scope.clone();
```

The `kinds` option tells which node kinds the resolved node may be. When no frame provides a key, the `fallback` of the injection is used, if any. The `getProvidedScopeFromPath` helper creates the scope of every instruction along a path, outermost first.

```ts
const scope = getProvidedScopeFromPath([root, program, parentInstruction, childInstruction]);
```

### `recordProvidedScopeVisitor`

The `recordProvidedScopeVisitor` keeps a `ProvidedScope` in sync with the traversal, the same way `recordNodeStackVisitor` does for a `NodeStack`: every instruction with `provides` opens a frame for the duration of its visit.

```ts
const scope = new ProvidedScope();
const visitor = pipe(
    voidVisitor(),
    v =>
        tapVisitor(v, 'injectedValueNode', node => {
            console.log(scope.get(node.key));
        }),
    v => recordProvidedScopeVisitor(v, scope),
);
```

## Byte sizes

### `getByteSizeVisitor`

The `getByteSizeVisitor` calculates the byte size of a given `TypeNode`, including any transforms it carries. It returns a `number` if the byte size is fixed or `null` if it is variable. It also supports `AccountNodes`, `InstructionNodes` and `DefinedTypeNodes` by measuring their data or type. It requires a `LinkableDictionary` instance to resolve any link nodes it encounters.

```ts
const visitor = getByteSizeVisitor(linkables);
const size = visit(tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]), visitor);
// ^ 36 (4 bytes for the u32 integer and 32 bytes for the public key)
```

By default, this visitor will keep track of its own `NodeStack` but you may provide your own via the `stack` option in order to share the same `NodeStack` across multiple visitors. Links are resolved from the closest program of that stack, so visit linked types with their full path, e.g. using `stack.visitPath`.

### `getMaxByteSizeVisitor`

The `getMaxByteSizeVisitor` works the same way as the `getByteSizeVisitor` but returns the maximum byte size a type may take, or `null` if it is unbounded. For instance, an option counts its item even when it is not fixed, and an enum counts its largest variant.

```ts
const visitor = getMaxByteSizeVisitor(linkables);
const size = visit(optionTypeNode(publicKeyTypeNode()), visitor);
// ^ 33 (1 byte for the u8 prefix and 32 bytes for the public key)
```

## Cyclic types

Defined types may link to themselves, directly or through other defined types. The following helpers detect such cycles and whether a recursive type can ever be created. Links are resolved from the closest program of the visited path, so the paths provided must contain the program defining the type.

### `getDefinedTypeLinksVisitor`

The `getDefinedTypeLinksVisitor` lists the paths of the defined types a node links to, without following these links. Links that cannot be resolved are skipped, and so are the defined types of `EnumValueNodes`, which only reference them. It powers `isDefinedTypeCyclic`.

```ts
// node = struct { value: link(amount), next: option<link(node)> }
const stack = new NodeStack();
stack.visitPath([root, program, node], getDefinedTypeLinksVisitor(linkables, { stack }));
// ^ [[root, program, amount], [root, program, node]]
```

### `getHasFiniteValueVisitor`

The `getHasFiniteValueVisitor` tells whether a type has at least one finite value, following links. Options, enums with another variant and collections without a fixed positive count stop a recursion, whereas a struct field or a fixed-size array linking back to its own type never does. It powers `hasDefinedTypeFiniteValue`.

```ts
// list = struct { next: option<link(list)> }, loop = struct { next: link(loop) }
const stack = new NodeStack();
stack.visitPath([root, program, list], getHasFiniteValueVisitor(linkables, { stack })); // true
stack.visitPath([root, program, loop], getHasFiniteValueVisitor(linkables, { stack })); // false
```

### `isDefinedTypeCyclic`

The `isDefinedTypeCyclic` helper tells whether a defined type links back to itself, directly or through other defined types, following the links recorded in a `LinkableDictionary`. It throws a `CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING` error if the path does not contain a program.

```ts
// node = struct { value: u8, next: option<link(node)> }
isDefinedTypeCyclic([root, program, node], linkables); // true
```

### `hasDefinedTypeFiniteValue`

The `hasDefinedTypeFiniteValue` helper tells whether a defined type has at least one finite value, using the `getHasFiniteValueVisitor`. Types lack one when they are cyclic without a way out, or when they contain an enum without variants. As above, the path must contain the program defining the type.

```ts
// list = struct { next: option<link(list)> }, loop = struct { next: link(loop) }
hasDefinedTypeFiniteValue([root, program, list], linkables); // true
hasDefinedTypeFiniteValue([root, program, loop], linkables); // false
```

## Other useful helpers

This package provides a few other helpers that may help build more complex visitors.

### `isValueNodeOfType`

The `isValueNodeOfType` helper tells whether a value node structurally matches the type at the end of the given path, following links to defined types. Ranges are not checked, e.g. `integerValueNode('256')` is a value of a `u8`, and injected or constant values never match since they are not concrete.

```ts
isValueNodeOfType(noneValueNode(), [root, program, optionTypeNode(integerTypeNode('u64'))], linkables); // true
isValueNodeOfType(stringValueNode('All'), [root, program, integerTypeNode('u64')], linkables); // false
```

### `getResolvedInstructionInputsVisitor`

The `getResolvedInstructionInputsVisitor` visits `InstructionNodes` only and returns an array of instruction accounts and data fields in the order they should be rendered for their default values to be resolved. Each entry contains the input `node` (an `InstructionAccountNode` or a `StructFieldTypeNode` with its `path`), its `resolvedDefaultValue`, with any injected value resolved, and the inputs it `dependsOn`.

For instance, say we have an instruction with a `vault` account defaulting to a PDA derived from the `authority` account and the `index` data field. The visitor will then return the inputs in the order `[authority, index, vault]`.

```ts
const instruction = instructionNode({
    identifier: 'createVault',
    accounts: [
        instructionAccountNode({
            identifier: 'vault',
            isSigner: false,
            isWritable: true,
            defaultValue: pdaValueNode('vault', {
                seeds: [
                    pdaSeedValueNode('authority', accountValueNode('authority')),
                    pdaSeedValueNode('index', dataValueNode('index')),
                ],
            }),
        }),
        instructionAccountNode({ identifier: 'authority', isSigner: true, isWritable: false }),
    ],
    data: structTypeNode([structFieldTypeNode({ identifier: 'index', type: integerTypeNode('u8') })]),
});

const stack = new NodeStack([root, program]);
const inputs = visit(instruction, getResolvedInstructionInputsVisitor(linkables, { stack }));
inputs.map(input => input.node.identifier);
// ^ ['authority', 'index', 'vault']
```

It accepts the following options:

- `stack`: The ancestry of the visited instruction. It must contain the program of the instruction for linked `data` types to be followed.
- `scope`: A `ProvidedScope` holding the providers enclosing the visited instruction, e.g. its parent instructions. The `provides` of the instruction itself are always added.
- `includeDataValueNodes`: Whether to include data fields whose default value is a static value. Defaults to `false`.

This is mostly useful when rendering client code for instructions. The `deduplicateInstructionDependencies` helper it relies on is exported as well, and removes duplicate accounts and data fields from a list of dependencies.

### `removeDocsVisitor`

The `removeDocsVisitor` goes through all nodes that have a `docs` property and removes it.

```ts
const node = definedTypeNode({
    identifier: 'authority',
    type: publicKeyTypeNode(),
    docs: 'The authority of the account',
});
const updatedNode = visit(node, removeDocsVisitor());
// ^ definedTypeNode({ identifier: 'authority', type: publicKeyTypeNode() })
```

This is used by the `getUniqueHashStringVisitor` when its `removeDocs` option is enabled, to get a unique identifier for a node regardless of its documentation.
