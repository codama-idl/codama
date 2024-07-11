# Kinobi ➤ Renderers

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/renderers.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/renderers.svg?style=flat&label=%40kinobi-so%2Frenderers
[npm-url]: https://www.npmjs.com/package/@kinobi-so/renderers

This package re-exports all available renderers for Kinobi IDLs.

## Installation

```sh
pnpm install @kinobi-so/renderers
```

> [!NOTE]
> This package is **not** included in the main [`kinobi`](../library) package.

## Available renderers

The following renderer packages are included in this package:

-   [`@kinobi-so/renderers-js`](../renderers-js) as `renderJavaScriptVisitor`
-   [`@kinobi-so/renderers-js-umi`](../renderers-js-umi) as `renderJavaScriptUmiVisitor`
-   [`@kinobi-so/renderers-rust`](../renderers-rust) as `renderRustVisitor`

```ts
// node ./kinobi.mjs
import { renderJavaScriptVisitor, renderJavaScriptUmiVisitor, renderRustVisitor } from '@kinobi-so/renderers';

kinobi.accept(renderJavaScriptVisitor('clients/js/src/generated'));
kinobi.accept(renderJavaScriptUmiVisitor('clients/js-umi/src/generated'));
kinobi.accept(renderRustVisitor('clients/rust/src/generated'));
```
