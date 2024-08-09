# `PdaNode`

This node provides a definition for a specific Program-Derived Address (PDA). It is characterized by a name and a list of seeds that can either be constant or variable.

![Diagram](https://github.com/kinobi-so/kinobi/assets/3642397/4f7c9718-1ffa-4f2c-aa45-71b3ce204219)

## Attributes

### Data

| Attribute   | Type              | Description                                                                                                                      |
| ----------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `kind`      | `"pdaNode"`       | The node discriminator.                                                                                                          |
| `name`      | `CamelCaseString` | The name of the PDA.                                                                                                             |
| `docs`      | `string[]`        | Markdown documentation for the PDA.                                                                                              |
| `programId` | `string`          | (Optional) The address of the program the PDA should derive from. Defaults to the address of the nearest `ProgramNode` ancestor. |

### Children

| Attribute | Type                                        | Description           |
| --------- | ------------------------------------------- | --------------------- |
| `seeds`   | [`PdaSeedNode`](./pdaSeedNodes/README.md)[] | The seeds of the PDA. |

## Functions

### `pdaNode(input)`

Helper function that creates a `pdaNode` object from an input object.

```ts
const node = pdaNode({
    name: 'counter',
    seeds: [variablePdaSeedNode('authority', publicKeyTypeNode())],
    docs: ['The counter PDA derived from its authority.'],
});
```

## Examples

### A PDA with constant and variable seeds

```ts
pdaNode({
    name: 'ticket',
    seeds: [
        constantPdaSeedNodeFromString('utf8', 'raffles'),
        variablePdaSeedNode('raffle', publicKeyTypeNode()),
        constantPdaSeedNodeFromString('utf8', 'tickets'),
        variablePdaSeedNode('ticketNumber', numberTypeNode('u32')),
    ],
});
```

### A PDA with no seeds

```ts
pdaNode({
    name: 'seedlessPda',
    seeds: [],
});
```
