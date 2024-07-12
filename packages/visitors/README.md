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

TODO

```ts
kinobi.update(createSubInstructionsFromEnumArgsVisitor());
```

### `deduplicateIdenticalDefinedTypesVisitor`

TODO

```ts
kinobi.update(deduplicateIdenticalDefinedTypesVisitor());
```

### `fillDefaultPdaSeedValuesVisitor`

TODO

```ts
kinobi.update(fillDefaultPdaSeedValuesVisitor());
```

### `flattenInstructionDataArgumentsVisitor`

TODO

```ts
kinobi.update(flattenInstructionDataArgumentsVisitor());
```

### `flattenStructVisitor`

TODO

```ts
kinobi.update(flattenStructVisitor());
```

### `getDefinedTypeHistogramVisitor`

TODO

```ts
kinobi.update(getDefinedTypeHistogramVisitor());
```

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
