# Kinobi ➤ Renderers ➤ Rust

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/renderers-rust.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/renderers-rust.svg?style=flat&label=%40kinobi-so%2Frenderers-rust
[npm-url]: https://www.npmjs.com/package/@kinobi-so/renderers-rust

This package generates Rust clients from your Kinobi IDLs.

## Installation

```sh
pnpm install @kinobi-so/renderers-rust
```

> [!NOTE]
> This package is **not** included in the main [`kinobi`](../library) package.
>
> However, note that the [`renderers`](../renderers) package re-exports the `renderVisitor` function of this package as `renderRustVisitor`.

## Documentation

_Coming soon..._

```ts
// node ./kinobi.mjs
import { renderVisitor } from '@kinobi-so/renderers-rust';

const pathToGeneratedFolder = path.join(__dirname, 'clients', 'rust', 'src', 'generated');
kinobi.accept(renderVisitor(pathToGeneratedFolder));
```
