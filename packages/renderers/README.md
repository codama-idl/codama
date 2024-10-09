# Codama ➤ Renderers

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/renderers.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/renderers.svg?style=flat&label=%40kinobi-so%2Frenderers
[npm-url]: https://www.npmjs.com/package/@codama/renderers

This package re-exports all available renderers for Codama IDLs.

## Installation

```sh
pnpm install @codama/renderers
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Available renderers

The following renderer packages are included in this package:

-   [`@codama/renderers-js`](../renderers-js) as `renderJavaScriptVisitor`
-   [`@codama/renderers-js-umi`](../renderers-js-umi) as `renderJavaScriptUmiVisitor`
-   [`@codama/renderers-rust`](../renderers-rust) as `renderRustVisitor`

```ts
// node ./codama.mjs
import { renderJavaScriptVisitor, renderJavaScriptUmiVisitor, renderRustVisitor } from '@codama/renderers';

codama.accept(renderJavaScriptVisitor('clients/js/src/generated'));
codama.accept(renderJavaScriptUmiVisitor('clients/js-umi/src/generated'));
codama.accept(renderRustVisitor('clients/rust/src/generated'));
```
