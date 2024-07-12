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

TODO

### `createSubInstructionsFromEnumArgsVisitor`

TODO

### `deduplicateIdenticalDefinedTypesVisitor`

TODO

### `fillDefaultPdaSeedValuesVisitor`

TODO

### `flattenInstructionDataArgumentsVisitor`

TODO

### `flattenStructVisitor`

TODO

### `getDefinedTypeHistogramVisitor`

TODO

### `setAccountDiscriminatorFromFieldVisitor`

TODO

### `setFixedAccountSizesVisitor`

TODO

### `setInstructionAccountDefaultValuesVisitor`

TODO

### `setInstructionDiscriminatorsVisitor`

TODO

### `setNumberWrappersVisitor`

TODO

### `setStructDefaultValuesVisitor`

TODO

### `transformDefinedTypesIntoAccountsVisitor`

TODO

### `transformU8ArraysToBytesVisitor`

TODO

### `unwrapDefinedTypesVisitor`

TODO

### `unwrapInstructionArgsDefinedTypesVisitor`

TODO

### `unwrapTupleEnumWithSingleStructVisitor`

TODO

### `unwrapTypeDefinedLinksVisitor`

TODO

### `updateAccountsVisitor`

TODO

### `updateDefinedTypesVisitor`

TODO

### `updateErrorsVisitor`

TODO

### `updateInstructionsVisitor`

TODO

### `updateProgramsVisitor`

TODO
