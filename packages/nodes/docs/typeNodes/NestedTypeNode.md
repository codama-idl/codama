# `NestedTypeNode<T>` (helper)

The `NestedTypeNode` type is a generic helper type that allows us to define nested requirements for a child node. The requirement `NestedTypeNode<T>` – where `T` is any `TypeNode` — tells us that the child node may be wrapped however they want but, eventually, we should end up with a `T` type node.

For instance, say we have the following requirement: `NestedTypeNode<StringTypeNode>`. This requirement can be fulfilled by a simple `StringTypeNode` but it can also be fulfilled by a `FixedSizeTypeNode` that wraps a `StringTypeNode` and fixes its byte length, since the end result is still a `StringTypeNode`. We can even go further and nest multiple wrappers, as long as the final node is a `StringTypeNode` — e.g. `HiddenPrefixTypeNode<PreOffsetTypeNode<FixedSizeTypeNode<StringTypeNode>>>`.

## Available wrappers

Therefore, when encountering a `NestedTypeNode<T>` requirement, we can either provide the type `T` itself or any nested combination of nodes that includes the following wrappers:

- [`FixedSizeTypeNode`](./FixedSizeTypeNode.md)
- [`HiddenPrefixTypeNode`](./HiddenPrefixTypeNode.md)
- [`HiddenSuffixTypeNode`](./HiddenSuffixTypeNode.md)
- [`PostOffsetTypeNode`](./PostOffsetTypeNode.md)
- [`PreOffsetTypeNode`](./PreOffsetTypeNode.md)
- [`SentinelTypeNode`](./SentinelTypeNode.md)
- [`SizePrefixTypeNode`](./SizePrefixTypeNode.md)

## Functions

Some helper functions are available to work with `NestedTypeNodes`.

### `resolveNestedTypeNode(nestedTypeNode)`

This function returns the final `TypeNode` of a nested type node. In other words, given a `NestedTypeNode<T>`, it will return the `T`.

```ts
const nestedNode = fixedSizeTypeNode(stringTypeNode('utf8'), 10);
const resolvedNode = resolveNestedTypeNode(nestedNode);
// ^ stringTypeNode('utf8')
```

### `transformNestedTypeNode(nestedTypeNode, map)`

This function transforms the final `TypeNode` of a nested type node from a provided function. In other words, given a `NestedTypeNode<T>` and a `T => U` function, it will return a `NestedTypeNode<U>`.

```ts
const nestedNode = fixedSizeTypeNode(stringTypeNode('utf8'), 10);
const transformedNode = transformNestedTypeNode(nestedNode, () => stringTypeNode('base64'));
// ^ fixedSizeTypeNode(stringTypeNode('base64'), 10);
```

### `isNestedTypeNode(node, kind)`

This function checks if the final `TypeNode` of a nested type node is of the given kind or kinds.

```ts
const nestedNode = fixedSizeTypeNode(stringTypeNode('utf8'), 10);

isNestedTypeNode(nestedNode, 'stringTypeNode'); // true
isNestedTypeNode(nestedNode, 'numberTypeNode'); // false
isNestedTypeNode(nestedNode, ['stringTypeNode', 'numberTypeNode']); // true
```

### `assertIsNestedTypeNode(node, kind)`

This function asserts that the final `TypeNode` of a nested type node is of the given kind or kinds. It throws an error if the assertion fails.

```ts
const nestedNode = fixedSizeTypeNode(stringTypeNode('utf8'), 10);

assertIsNestedTypeNode(nestedNode, 'stringTypeNode'); // Ok
assertIsNestedTypeNode(nestedNode, 'numberTypeNode'); // Throws an error
assertIsNestedTypeNode(nestedNode, ['stringTypeNode', 'numberTypeNode']); // Ok
```
