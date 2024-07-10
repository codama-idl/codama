# Kinobi ➤ Renderers ➤ JavaScript

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/renderers-js.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/renderers-js.svg?style=flat&label=%40kinobi-so%2Frenderers-js
[npm-url]: https://www.npmjs.com/package/@kinobi-so/renderers-js

This package generates JavaScript clients from your Kinobi IDLs. The generated clients are compatible with the soon-to-be-released 2.0 line of [`@solana/web3.js`](https://github.com/solana-labs/solana-web3.js).

## Installation

```sh
pnpm install @kinobi-so/renderers-js
```

> [!NOTE]
> This package is **not** included in the main [`kinobi`](../library) package.
>
> However, note that the [`renderers`](../renderers) package re-exports the `renderVisitor` function of this package as `renderJavaScriptVisitor`.

## Documentation

_Coming soon..._

```ts
// node ./kinobi.mjs
import { renderVisitor } from '@kinobi-so/renderers-js';

const pathToGeneratedFolder = path.join(__dirname, 'clients', 'js', 'src', 'generated');
kinobi.accept(renderVisitor(pathToGeneratedFolder));
```
