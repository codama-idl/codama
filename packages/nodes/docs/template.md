# `SomeNode`

Some node description.

<!-- Some node diagram (optional). -->
<!-- ![Diagram](https://github.com/kinobi-so/kinobi/assets/3642397/6049cf77-9a70-4915-8276-dd571d2f8828) -->

## Attributes

### Data

| Attribute | Type              | Description                          |
| --------- | ----------------- | ------------------------------------ |
| `kind`    | `"someNode"`      | The node discriminator.              |
| `name`    | `CamelCaseString` | The name of the node.                |
| `docs`    | `string[]`        | Markdown documentation for the type. |

### Children

| Attribute | Type                      | Description             |
| --------- | ------------------------- | ----------------------- |
| `child`   | [`TypeNode`](./typeNodes) | The child of some node. |

OR

_This node has no children._

## Functions

### `someNode(input)`

Helper function that creates a `SomeNode` object from an input object.

```ts
const node = someNode({
    name: 'person',
    docs: ['This type describes a Person.'],
    child: structTypeNode([
        structFieldTypeNode({ name: 'name', type: stringTypeNode('utf8') }),
        structFieldTypeNode({ name: 'age', type: numberTypeNode('u8') }),
    ]),
});
```
