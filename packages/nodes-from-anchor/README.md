# Kinobi ➤ Nodes From Anchor

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/nodes.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/nodes.svg?style=flat&label=%40kinobi-so%2Fnodes
[npm-url]: https://www.npmjs.com/package/@kinobi-so/nodes

## Installation

```sh
pnpm install @kinobi-so/nodes
```

> [!NOTE]
> This package is included in the main [`kinobi`](../library) package. Meaning, you already have access to its content if you are installing Kinobi this way.
>
> ```sh
> pnpm install kinobi
> ```

## Documentation

Parse Anchor IDL version `0.0` or `0.1` (from Anchor `0.30`) into Kinobi node definitions.

```javascript
// node ./kinobi.mjs

import path from 'path';
import { renderRustVisitor, renderJavaScriptVisitor } from '@kinobi-so/renderers';
import { rootNodeFromAnchor } from '@kinobi-so/nodes-from-anchor';
import { readJson } from '@kinobi-so/renderers-core';
import { visit } from '@kinobi-so/visitors-core';

const clientDir = path.join(__dirname, 'clients');

const idlPath = path.join(__dirname, 'target', 'idl', 'anchor_program.json');
const idl = readJson(idlPath);

const node = rootNodeFromAnchor(idl);

const sdkName = idl.metadata.name;

await visit(node, renderJavaScriptVisitor(path.join(clientDir, 'js', sdkName, 'src', 'generated')));

visit(node, renderRustVisitor(path.join(clientDir, 'rust', sdkName, 'src', 'generated'), { format: true }));
```
