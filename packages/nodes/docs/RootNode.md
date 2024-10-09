# `RootNode`

This node represents the starting point of the Codama IDL. It contains a single `ProgramNode` which the Codama IDL is describing as well as any additional programs that may be referenced by the main program. This node is also responsible for setting the standard and version of the IDL.

![Diagram](https://github.com/codama-idl/codama/assets/3642397/96c43c75-5925-4b6b-a1e0-8b8c61317cfe)

## Attributes

### Data

| Attribute  | Type         | Description                                                                                                                                                                                   |
| ---------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`     | `"rootNode"` | The node discriminator.                                                                                                                                                                       |
| `standard` | `"codama"`   | The IDL standard used by the `RootNode` which is always `"codama"`. This can help other communities fork the Codama standard.                                                                 |
| `version`  | `\d.\d.\d`   | The semantic version of the standard used by the `RootNode`. That is — unless a different standard is used — this will be the Codama version from which this entire tree of node was created. |

### Children

| Attribute            | Type                                | Description                                                             |
| -------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| `program`            | [`ProgramNode`](./ProgramNode.md)   | The main program being described.                                       |
| `additionalPrograms` | [`ProgramNode`](./ProgramNode.md)[] | (Optional) Additional programs that are referenced by the main program. |

## Functions

### `rootNode(program, additionalPrograms?)`

Helper function that creates a `RootNode` object from a `ProgramNode` and an optional array of additional `ProgramNodes`. Note that the `standard` is automatically set to `"codama"` and the `version` is set to the Codama version installed.

```ts
const node = rootNode(programNode({ ... }));
```

## Examples

### A root node with a single program

```ts
const node = rootNode(
    programNode({
        name: 'counter',
        publicKey: '2R3Ui2TVUUCyGcZdopxJauk8ZBzgAaHHZCVUhm5ifPaC',
        version: '1.0.0',
        accounts: [
            accountNode({
                name: 'counter',
                data: structTypeNode([
                    structFieldTypeNode({ name: 'authority', type: publicKeyTypeNode() }),
                    structFieldTypeNode({ name: 'value', type: numberTypeNode('u32') }),
                ]),
            }),
        ],
        instructions: [
            instructionNode({ name: 'create' /* ... */ }),
            instructionNode({ name: 'increment' /* ... */ }),
            instructionNode({ name: 'transferAuthority' /* ... */ }),
            instructionNode({ name: 'delete' /* ... */ }),
        ],
    }),
);
```
