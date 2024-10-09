# Codama ➤ Nodes From Anchor

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/nodes-from-anchor.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/nodes-from-anchor.svg?style=flat&label=%40kinobi-so%2Fnodes-from-anchor
[npm-url]: https://www.npmjs.com/package/@codama/nodes-from-anchor

This package converts Anchor IDLs from various versions into Codama IDLs.

## Installation

```sh
pnpm install @codama/nodes-from-anchor
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Functions

### `rootNodeFromAnchor(anchorIdl)`

This function takes a valid Anchor IDL and returns a `RootNode`.

```js
// node ./codama.mjs
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { createFromRoot } from 'codama';
import { readFileSync } from 'node:fs';
import path from 'path';

// Read the content of your IDL file.
const anchorIdlPath = path.join(__dirname, 'target', 'idl', 'anchor_program.json');
const anchorIdl = JSON.parse(readFileSync(anchorIdlPath, 'utf-8'));

// Parse it into a Codama IDL.
const codama = createFromRoot(rootNodeFromAnchor(anchorIdl));
```
