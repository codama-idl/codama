# Codama ➤ Validators

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/validators.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/validators.svg?style=flat&label=%40codama%2Fvalidators
[npm-url]: https://www.npmjs.com/package/@codama/validators

This package offers a set of validation rules for Codama IDLs to ensure that they are correctly formatted.

## Installation

```sh
pnpm install @codama/validators
```

> [!NOTE]
> This package is included in the main [`codama`](../library) package. Meaning, you already have access to its content if you are installing Codama this way.
>
> ```sh
> pnpm install codama
> ```

## Types

### `ValidationItem`

A validation item describes a single piece of information — typically a warning or an error — about a node in the Codama IDL.

```ts
type ValidationItem = {
    // The level of importance of a validation item.
    level: 'debug' | 'trace' | 'info' | 'warn' | 'error';
    // A human-readable message describing the issue or information.
    message: string;
    // The node that the validation item is related to.
    node: Node;
    // The stack of nodes that led to the node above.
    stack: readonly Node[];
};
```

## Functions

### `getValidationItemsVisitor(visitor)`

The `getValidationItemsVisitor` function returns a visitor that collects all validation items from a Codama IDL. Note that this visitor is still a work in progress and does not cover all validation rules.

```ts
import { getValidationItemsVisitor } from '@codama/validators';

const validationItems = codama.accept(getValidationItemsVisitor());
```

### `throwValidatorItemsVisitor(visitor)`

The `throwValidatorItemsVisitor` function accepts a `Visitor<ValidationItemp[]>` and throws an error if any validation items above a certain level are found. By default, the level is set to `'error'` but a second argument can be passed to change it.

```ts
import { throwValidatorItemsVisitor, getValidationItemsVisitor } from '@codama/validators';

// Throw if any "error" items are found.
codama.accept(throwValidatorItemsVisitor(getValidationItemsVisitor()));

// Throw if any "warn" or "error" items are found.
codama.accept(throwValidatorItemsVisitor(getValidationItemsVisitor(), 'warn'));
```
