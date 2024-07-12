# Kinobi ➤ Visitors

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/visitors.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/visitors.svg?style=flat&label=%40kinobi-so%2Fvisitors
[npm-url]: https://www.npmjs.com/package/@kinobi-so/visitors

This package offers various visitors for Kinobi IDLs to traverse and manipulate their nodes.

## Installation

```sh
pnpm install @kinobi-so/visitors
```

> [!NOTE]
> This package is included in the main [`kinobi`](../library) package. Meaning, you already have access to its content if you are installing Kinobi this way.
>
> ```sh
> pnpm install kinobi
> ```

## Understanding visitors

This package includes and re-exports the [`@kinobi-so/visitors-core`](../visitors-core/README.md) package which provides the core interfaces and functions to create and compose visitors.

To get a better understanding of visitors and how they work, please refer to the [`@kinobi-so/visitors-core` documentation](../visitors-core/README.md).

In the rest of this documentation, we focus on the high-level visitors that are only available in this package. The main goal of these visitors is to provide a set of specific operations that can be applied to Kinobi IDLs — as opposed to the generic primitives provided by the core package.

For instance, this package provides visitors to unwrap link nodes, update instructions, add PDAs, set default values, and more.

Let's go through all of them alphabetically.

## Available visitors

### `addPdasVisitor`

This visitor adds `PdaNodes` to the desired `ProgramNodes`. It accepts an object where the keys are the program names and the values are the `PdaNodes` to add within these programs.

```ts
kinobi.update(
    addPdasVisitor({
        // Add a PDA to the 'token' program.
        token: [
            {
                name: 'associatedToken',
                seeds: [
                    variablePdaSeedNode('mint', publicKeyTypeNode()),
                    constantPdaSeedNode(
                        publicKeyTypeNode(),
                        publicKeyValueNode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                    ),
                    variablePdaSeedNode('owner', publicKeyTypeNode()),
                ],
            },
        ],
        // Add two PDAs to the 'counter' program.
        counter: [
            {
                name: 'counter',
                seeds: [variablePdaSeedNode('authority', publicKeyTypeNode())],
            },
            {
                name: 'counterConfig',
                seeds: [variablePdaSeedNode('counter', publicKeyTypeNode())],
            },
        ],
    }),
);
```

### `createSubInstructionsFromEnumArgsVisitor`

This visitor splits an instruction into multiple sub-instructions by using an enum argument such that each of its variants creates a different sub-instruction. It accepts an object where the keys are the instruction names and the values are the enum argument names that will be used to split the instruction.

```ts
kinobi.update(
    createSubInstructionsFromEnumArgsVisitor({
        mint: 'mintArgs',
        transfer: 'transferArgs',
        burn: 'burnArgs',
    }),
);
```

### `deduplicateIdenticalDefinedTypesVisitor`

This visitor goes through the `DefinedTypeNodes` of all `ProgramNodes` inside the Kinobi IDL and remove any duplicates. A `DefinedTypeNode` is considered a duplicate if it has the same name and data structure as another `DefinedTypeNode`. This is useful when you have multiple programs that share the same types.

```ts
kinobi.update(deduplicateIdenticalDefinedTypesVisitor());
```

### `fillDefaultPdaSeedValuesVisitor`

This visitor fills any missing `PdaSeedValueNodes` from `PdaValueNodes` using the provided `InstructionNode` such that:

-   If a `VariablePdaSeedNode` is of type `PublicKeyTypeNode` and the name of the seed matches the name of an account in the `InstructionNode`, then a new `PdaSeedValueNode` will be added with the matching account.
-   Otherwise, if a `VariablePdaSeedNode` is of any other type and the name of the seed matches the name of an argument in the `InstructionNode`, then a new `PdaSeedValueNode` will be added with the matching argument.
-   Otherwise, no `PdaSeedValueNode` will be added.

It also requires a [`LinkableDictionary`](../visitors-core/README.md#linkable-dictionary) to resolve any link nodes and an optional `strictMode` boolean to throw an error if seeds are still missing after the visitor has run.

Note that this visitor is mainly used for internal purposes.

```ts
kinobi.update(fillDefaultPdaSeedValuesVisitor(instructionNode, linkables, strictMode));
```

### `flattenInstructionDataArgumentsVisitor`

This visitor flattens any instruction arguments of type `StructTypeNode` such that their fields are no longer nested. This can be useful to simplify the data structure of an instruction.

```ts
kinobi.update(flattenInstructionDataArgumentsVisitor());
```

### `flattenStructVisitor`

This visitor flattens any struct fields that are also structs such that their fields are no longer nested. It accepts an object such that the keys are the struct names and the values are the field names to flatten or `"*"` to flatten all struct fields.

```ts
kinobi.update(
    flattenStructVisitor({
        counter: ['data', 'config'],
        escrow: '*',
    }),
);
```

### `getDefinedTypeHistogramVisitor`

This visitor go through all `DefinedTypeNodes` and outputs a histogram of how many times each type is used in the Kinobi IDL.

```ts
const histogram = kinobi.accept(getDefinedTypeHistogramVisitor());
```

The returned histogram is an object such that the keys are the names of visited `DefinedTypeNodes` and the values are objects with properties described below.

```ts
export type DefinedTypeHistogram = {
    [key: CamelCaseString]: {
        // The number of times the type is used as a direct instruction argument.
        directlyAsInstructionArgs: number;
        // The number of times the type is used in account data.
        inAccounts: number;
        // The number of times the type is used in other defined types.
        inDefinedTypes: number;
        // The number of times the type is used in instruction arguments.
        inInstructionArgs: number;
        // The number of times the type is used in total.
        total: number;
    };
};
```

This histogram is used internally in other visitors to understand how types are used before applying transformations.

### `setAccountDiscriminatorFromFieldVisitor`

TODO

```ts
kinobi.update(setAccountDiscriminatorFromFieldVisitor());
```

### `setFixedAccountSizesVisitor`

TODO

```ts
kinobi.update(setFixedAccountSizesVisitor());
```

### `setInstructionAccountDefaultValuesVisitor`

TODO

```ts
kinobi.update(setInstructionAccountDefaultValuesVisitor());
```

### `setInstructionDiscriminatorsVisitor`

TODO

```ts
kinobi.update(setInstructionDiscriminatorsVisitor());
```

### `setNumberWrappersVisitor`

TODO

```ts
kinobi.update(setNumberWrappersVisitor());
```

### `setStructDefaultValuesVisitor`

TODO

```ts
kinobi.update(setStructDefaultValuesVisitor());
```

### `transformDefinedTypesIntoAccountsVisitor`

TODO

```ts
kinobi.update(transformDefinedTypesIntoAccountsVisitor());
```

### `transformU8ArraysToBytesVisitor`

TODO

```ts
kinobi.update(transformU8ArraysToBytesVisitor());
```

### `unwrapDefinedTypesVisitor`

TODO

```ts
kinobi.update(unwrapDefinedTypesVisitor());
```

### `unwrapInstructionArgsDefinedTypesVisitor`

TODO

```ts
kinobi.update(unwrapInstructionArgsDefinedTypesVisitor());
```

### `unwrapTupleEnumWithSingleStructVisitor`

TODO

```ts
kinobi.update(unwrapTupleEnumWithSingleStructVisitor());
```

### `unwrapTypeDefinedLinksVisitor`

TODO

```ts
kinobi.update(unwrapTypeDefinedLinksVisitor());
```

### `updateAccountsVisitor`

TODO

```ts
kinobi.update(updateAccountsVisitor());
```

### `updateDefinedTypesVisitor`

TODO

```ts
kinobi.update(updateDefinedTypesVisitor());
```

### `updateErrorsVisitor`

TODO

```ts
kinobi.update(updateErrorsVisitor());
```

### `updateInstructionsVisitor`

TODO

```ts
kinobi.update(updateInstructionsVisitor());
```

### `updateProgramsVisitor`

TODO

```ts
kinobi.update(updateProgramsVisitor());
```
