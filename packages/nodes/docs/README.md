# `Node` (abstract)

The `Node` type helper represents all available nodes. Note that `Node` is a type alias and cannot be used directly as a node. Instead you may use any node to satisfy the `Node` type. You can [see all available nodes here](../README.md#documentation).

## Functions

Some helper functions are also available to work with nodes.

### `isNode(node, kind)`

Type guard that checks if a node is of a specific kind or part of a list of kinds. If the provided node is `null` or `undefined`, the function returns `false`.

```ts
isNode(stringTypeNode('utf8'), 'stringTypeNode'); // true.
isNode(stringTypeNode('utf8'), 'numberTypeNode'); // false.
isNode(stringTypeNode('utf8'), ['stringTypeNode', 'numberTypeNode']); // true.
isNode(null, 'stringTypeNode'); // false.
isNode(undefined, 'stringTypeNode'); // false.
```

### `assertIsNode(node, kind)`

Type guard that asserts that a node is of a specific kind or part of a list of kinds. If the provided node is `null` or `undefined`, the function throws an error.

```ts
assertIsNode(stringTypeNode('utf8'), 'stringTypeNode'); // Ok.
assertIsNode(stringTypeNode('utf8'), 'numberTypeNode'); // Throws an error.
assertIsNode(stringTypeNode('utf8'), ['stringTypeNode', 'numberTypeNode']); // Ok.
assertIsNode(null, 'stringTypeNode'); // Throws an error.
assertIsNode(undefined, 'stringTypeNode'); // Throws an error.
```

### `isNodeFilter(kind)`

This function returns a function that acts as the `isNode` function but with a predefined kind or list of kinds to check against. This is a useful function to use in combination with array functions like `filter`.

```ts
myNodes.filter(isNodeFilter('stringTypeNode')); // Keep only string type nodes.
myNodes.filter(isNodeFilter(['stringTypeNode', 'numberTypeNode'])); // Keep only string and number type nodes.
```

### `assertIsNodeFilter(kind)`

This function returns a function that acts as the `assertIsNode` function but with a predefined kind or list of kinds to check against. This is a useful function to use in combination with array functions like `filter`.

```ts
myNodes.filter(assertIsNodeFilter('stringTypeNode')); // Fail if there are non-string type node.
myNodes.filter(assertIsNodeFilter(['stringTypeNode', 'numberTypeNode'])); // Fail if there are nodes that are not string or number type nodes.
```

### `removeNullAndAssertIsNodeFilter(kind)`

This function acts like the `assertIsNodeFilter` function below but removes `null` and `undefined` values before asserting the kind or kinds.

```ts
const myNodes = [null, stringTypeNode('utf8'), undefined, stringTypeNode('base58')];

myNodes.filter(removeNullAndAssertIsNodeFilter('stringTypeNode')); // Ok and removes null and undefined values.
myNodes.filter(removeNullAndAssertIsNodeFilter('numberTypeNode')); // Throws an error.
myNodes.filter(removeNullAndAssertIsNodeFilter(['stringTypeNode', 'numberTypeNode'])); // Ok and removes null and undefined values.
```
