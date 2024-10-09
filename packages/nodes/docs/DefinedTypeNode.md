# `DefinedTypeNode`

This node defines a named type that can be reused in other types using a [`DefinedTypeLinkNode`](./linkNodes/DefinedTypeLinkNode.md).

![Diagram](https://github.com/codama-idl/codama/assets/3642397/6049cf77-9a70-4915-8276-dd571d2f8828)

## Attributes

### Data

| Attribute | Type                | Description                          |
| --------- | ------------------- | ------------------------------------ |
| `kind`    | `"definedTypeNode"` | The node discriminator.              |
| `name`    | `CamelCaseString`   | The name of the reusable type.       |
| `docs`    | `string[]`          | Markdown documentation for the type. |

### Children

| Attribute | Type                                | Description                   |
| --------- | ----------------------------------- | ----------------------------- |
| `type`    | [`TypeNode`](./typeNodes/README.md) | The concrete type definition. |

## Functions

### `definedTypeNode(input)`

Helper function that creates a `DefinedTypeNode` object from an input object.

```ts
const node = definedTypeNode({
    name: 'person',
    docs: ['This type describes a Person.'],
    type: structTypeNode([
        structFieldTypeNode({ name: 'name', type: stringTypeNode('utf8') }),
        structFieldTypeNode({ name: 'age', type: numberTypeNode('u8') }),
    ]),
});
```
