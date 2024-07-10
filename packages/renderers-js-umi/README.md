# Kinobi ➤ Renderers ➤ JavaScript Umi

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/renderers-js-umi.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/renderers-js-umi.svg?style=flat&label=%40kinobi-so%2Frenderers-js-umi
[npm-url]: https://www.npmjs.com/package/@kinobi-so/renderers-js-umi

This package generates JavaScript clients from your Kinobi IDLs. The generated clients are compatible with Metaplex's [Umi framework](https://github.com/metaplex-foundation/umi).

## Installation

```sh
pnpm install @kinobi-so/renderers-js-umi
```

> [!NOTE]
> This package is **not** included in the main [`kinobi`](../library) package.
>
> However, note that the [`renderers`](../renderers) package re-exports the `renderVisitor` function of this package as `renderJavaScriptUmiVisitor`.

## Documentation

_Coming soon..._

```ts
// node ./kinobi.mjs
import { renderVisitor } from '@kinobi-so/renderers-js-umi';

const pathToGeneratedFolder = path.join(__dirname, 'clients', 'js', 'src', 'generated');
kinobi.accept(renderVisitor(pathToGeneratedFolder));
```
