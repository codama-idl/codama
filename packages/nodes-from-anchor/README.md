# Kinobi ➤ Nodes From Anchor

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
