# Kinobi ➤ Nodes From Anchor

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/nodes-from-anchor.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/nodes-from-anchor.svg?style=flat&label=%40kinobi-so%2Fnodes-from-anchor
[npm-url]: https://www.npmjs.com/package/@kinobi-so/nodes-from-anchor

This package converts Anchor IDLs from various versions into Kinobi IDLs.

## Installation

```sh
pnpm install @kinobi-so/nodes-from-anchor
```

> [!NOTE]
> This package is **not** included in the main [`kinobi`](../library) package.

## Functions

### `rootNodeFromAnchor(anchorIdl)`

This function takes a valid Anchor IDL and returns a `RootNode`.

```js
// node ./kinobi.mjs
import { rootNodeFromAnchor } from '@kinobi-so/nodes-from-anchor';
import { createFromRoot } from 'kinobi';
import { readFileSync } from 'node:fs';
import path from 'path';

// Read the content of your IDL file.
const anchorIdlPath = path.join(__dirname, 'target', 'idl', 'anchor_program.json');
const anchorIdl = JSON.parse(readFileSync(anchorIdlPath, 'utf-8'));

// Parse it into a Kinobi IDL.
const kinobi = createFromRoot(rootNodeFromAnchor(anchorIdl));
```
