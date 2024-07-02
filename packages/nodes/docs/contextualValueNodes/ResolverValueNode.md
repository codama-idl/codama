# `ResolverValueNode`

A node that represents any custom value or logic described by some documentation.

This node acts as a fallback node for any value or logic that cannot easily be described by the other nodes. Instead, the program maintainer can use this node to describe the value or logic in detail. Visitors that render code from Kinobi IDLs will treat these `ResolverValueNodes` as functions that can be injected into the generated code.

## Attributes

### Data

| Attribute    | Type                  | Description                                                                                                                                                                                                                                                                                                                        |
| ------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`       | `"resolverValueNode"` | The node discriminator.                                                                                                                                                                                                                                                                                                            |
| `name`       | `CamelCaseString`     | A unique name for the resolver. This will typically be the name of the function that the renderers will try to invoke.                                                                                                                                                                                                             |
| `docs`       | `string[]`            | Detailed Markdown documentation for the resolver.                                                                                                                                                                                                                                                                                  |
| `importFrom` | `string`              | (Optional) A unique string that identifies the module from which the resolver should be imported. Defaults to `"hooked"` meaning the function is locally available next to the generated code. Note that this is a renderer-specific piece of data that may be removed in the future and pushed to the renderers' options instead. |

### Children

| Attribute   | Type                                                                                             | Description                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dependsOn` | ([`AccountValueNode`](./AccountValueNode.md) \| [`ArgumentValueNode`](./ArgumentValueNode.md))[] | (Optional) The list of accounts or arguments that this custom value depends on. This is useful for code renderers to know in which order they should resolve default values. |

## Functions

### `resolverValueNode(name, options)`

Helper function that creates a `ResolverValueNode` object from the resolver name and some options.

```ts
const node = resolverValueNode('resolveCustomTokenProgram', {
    docs: [
        'If the mint account has more than 0 decimals and the ',
        'delegated amount is greater than zero, than we use our ',
        'own custom token program. Otherwise, we use Token 2022.',
    ],
    dependsOn: [accountValueNode('mint'), argumentValueNode('delegatedAmount')],
});
```
