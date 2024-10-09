# `ProgramNode`

This node represents an entire program deployed on-chain. It defines all elements of a program such as accounts, instructions, PDAs, errors, etc.

![Diagram](https://github.com/codama/kinobi/assets/3642397/37ec38ea-66df-4c08-81c3-822ef4388580)

## Attributes

### Data

| Attribute   | Type                    | Description                                                                  |
| ----------- | ----------------------- | ---------------------------------------------------------------------------- |
| `kind`      | `"programNode"`         | The node discriminator.                                                      |
| `name`      | `CamelCaseString`       | The name of the program.                                                     |
| `publicKey` | `string`                | The 32-bytes address of the program base58 encoded.                          |
| `version`   | `\d.\d.\d`              | The semantic version of the program being defined.                           |
| `docs`      | `string[]`              | Markdown documentation for the program.                                      |
| `origin`    | `"anchor"` \| `"shank"` | (Optional) An optional attribute tells us how this program node was created. |

### Children

| Attribute      | Type                                        | Description                                                   |
| -------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `accounts`     | [`AccountNode`](./AccountNode.md)[]         | The accounts created and managed by the program.              |
| `instructions` | [`InstructionNode`](./InstructionNode.md)[] | The instructions that allows us to interact with the program. |
| `definedTypes` | [`DefinedTypeNode`](./DefinedTypeNode.md)[] | Some reusable types defined by the program.                   |
| `pdas`         | [`PdaNode`](./PdaNode.md)[]                 | The Program-Derived Addresses (PDAs) used by the program.     |
| `errors`       | [`ErrorNode`](./ErrorNode.md)[]             | The errors that can be thrown by the program.                 |

## Functions

### `programNode(input)`

Helper function that creates a `ProgramNode` object from an input object

```ts
const node = programNode({
    name: 'counter',
    publicKey: '7ovtg4pFqjQdSwFAUCu8gTnh5thZHzAyJFXy3Ssnj3yK',
    version: '1.42.6',
    accounts: [],
    instructions: [],
    definedTypes: [],
    pdas: [],
    errors: [],
});
```

### `getAllPrograms(node)`

Helper function that returns all `ProgramNodes` under a given node. This can be a `RootNode`, a `ProgramNode` — returning itself in an array — or an array of `ProgramNode`.

```ts
const allPrograms = getAllPrograms(rootNode);
```

### `getAllPdas(node)`

Helper function that returns all `PdaNodes` under a given node. This can be a `RootNode`, a `ProgramNode` or an array of `ProgramNode`.

```ts
const allPdas = getAllPdas(rootNode);
```

### `getAllAccounts(node)`

Helper function that returns all `AccountNodes` under a given node. This can be a `RootNode`, a `ProgramNode` or an array of `ProgramNode`.

```ts
const allAccounts = getAllAccounts(rootNode);
```

### `getAllDefinedTypes(node)`

Helper function that returns all `DefinedTypeNodes` under a given node. This can be a `RootNode`, a `ProgramNode` or an array of `ProgramNode`.

```ts
const allDefinedTypes = getAllDefinedTypes(rootNode);
```

### `getAllInstructions(node)`

Helper function that returns all `InstructionNodes` under a given node. This can be a `RootNode`, a `ProgramNode` or an array of `ProgramNode`.

```ts
const allInstructions = getAllInstructions(rootNode);
```

### `getAllErrors(node)`

Helper function that returns all `ErrorNodes` under a given node. This can be a `RootNode`, a `ProgramNode` or an array of `ProgramNode`.

```ts
const allErrors = getAllErrors(rootNode);
```
