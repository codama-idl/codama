# `DefinedTypeNode`

This node defines a named type that can be reused in other types using a [`DefinedTypeLinkNode`](./linkNodes/DefinedTypeLinkNode.md).

![Diagram](https://github.com/kinobi-so/kinobi/assets/3642397/6049cf77-9a70-4915-8276-dd571d2f8828)

## Data

| Attribute | Type                | Description                          |
| --------- | ------------------- | ------------------------------------ |
| `kind`    | `"definedTypeNode"` | The node discriminator.              |
| `name`    | `CamelCaseString`   | The name of the reusable type.       |
| `docs`    | `string[]`          | Markdown documentation for the type. |

## Children

| Attribute | Type                      | Description                   |
| --------- | ------------------------- | ----------------------------- |
| `type`    | [`TypeNode`](./typeNodes) | The concrete type definition. |

## Functions

TODO

## Examples

```ts
const todo = 4;
```
