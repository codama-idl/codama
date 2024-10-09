# `ErrorNode`

This node defines an error that can be returned by a program.

![Diagram](https://github.com/codama/codama/assets/3642397/0bde98ea-0327-404b-bf38-137d105826b0)

## Attributes

### Data

| Attribute | Type              | Description                                      |
| --------- | ----------------- | ------------------------------------------------ |
| `kind`    | `"errorNode"`     | The node discriminator.                          |
| `name`    | `CamelCaseString` | The name of the error.                           |
| `code`    | `number`          | The error code.                                  |
| `message` | `string`          | A human-friendly message describing the error.   |
| `docs`    | `string[]`        | Additional Markdown documentation for the error. |

### Children

_This node has no children._

## Functions

### `errorNode(input)`

Helper function that creates a `ErrorNode` object from an input object.

```ts
const node = errorNode({
    name: 'invalidAmountArgument',
    code: 1,
    message: 'The amount argument is invalid.',
});
```
