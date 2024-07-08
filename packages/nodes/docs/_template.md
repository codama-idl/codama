# `SomeNode`

This node represents TODO.

## Attributes

### Data

| Attribute | Type              | Description                          |
| --------- | ----------------- | ------------------------------------ |
| `kind`    | `"someNode"`      | The node discriminator.              |
| `name`    | `CamelCaseString` | The name of the node.                |
| `docs`    | `string[]`        | Markdown documentation for the type. |

### Children

| Attribute | Type                                 | Description             |
| --------- | ------------------------------------ | ----------------------- |
| `child`   | [`TypeNode`](../typeNodes/README.md) | The child of some node. |

OR

_This node has no children._

## Functions

### `someNode(input)`

Helper function that creates a `SomeNode` object from TODO.

```ts
const node = someNode(TODO);
```

## Examples

### Some example title

```ts
someNode(TODO);

// 0.01 USD   => 0x01000000
// 10 USD     => 0x03E80000
// 400.60 USD => 0x9C7C0000
```
