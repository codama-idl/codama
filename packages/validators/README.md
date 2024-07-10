# Kinobi ➤ Validators

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/validators.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/validators.svg?style=flat&label=%40kinobi-so%2Fvalidators
[npm-url]: https://www.npmjs.com/package/@kinobi-so/validators

This package offers a set of validation rules for Kinobi IDLs to ensure that they are correctly formatted.

## Installation

```sh
pnpm install @kinobi-so/validators
```

> [!NOTE]
> This package is included in the main [`kinobi`](../library) package. Meaning, you already have access to its content if you are installing Kinobi this way.
>
> ```sh
> pnpm install kinobi
> ```

## Documentation

_Coming soon..._

```ts
import { throwValidatorItemsVisitor, getValidationItemsVisitor } from '@kinobi-so/validators';

kinobi.accept(throwValidatorItemsVisitor(getValidationItemsVisitor()));
```
