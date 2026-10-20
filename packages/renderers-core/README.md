# Codama ➤ Renderers ➤ Core

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/renderers-core.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/renderers-core.svg?style=flat&label=%40codama%2Frenderers-core
[npm-url]: https://www.npmjs.com/package/@codama/renderers-core

This package provides the visitors renderers use to write the output of Codama IDLs to the filesystem, built on top of [`@codama/fragments`](../fragments). Its aim is mainly to provide helpers for other renderer packages such as [`@codama/renderers-js`](https://github.com/codama-idl/renderers-js) and [`@codama/renderers-rust`](https://github.com/codama-idl/renderers-rust).

## Installation

```sh
pnpm install @codama/renderers-core
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Migrating from the `@codama/fragments` re-export

Fragment primitives, casing helpers, filesystem and path helpers, and the `RenderMap` data operations live in [`@codama/fragments`](../fragments) and are no longer re-exported by this package. Import them from `@codama/fragments` directly; see the [`@codama/fragments` README](../fragments/README.md) for their documentation.

```diff
- import { createRenderMap, deleteDirectory, writeRenderMapVisitor } from '@codama/renderers-core';
+ import { createRenderMap, deleteDirectory } from '@codama/fragments';
+ import { writeRenderMapVisitor } from '@codama/renderers-core';
```

## Visitors

### `writeRenderMapVisitor`

When building renderers, you will most likely create a visitor that traverses the Codama IDL and returns a [`RenderMap`](../fragments/README.md#render-maps). That way, you can test the generated content without having to write it to the filesystem. For instance, the [`@codama/renderers-js`](https://github.com/codama-idl/renderers-js) package exports a `getRenderMapVisitor` function that does just that.

```ts
import { getRenderMapVisitor } from '@codama/renderers-js';

const renderMap = codama.accept(getRenderMapVisitor());
```

If you have access to a visitor that returns a `RenderMap` — also described as `Visitor<RenderMap>` — then, you can wrap it inside the `writeRenderMapVisitor` to directly write the content to the filesystem at the given base directory.

```ts
import { getRenderMapVisitor } from '@codama/renderers-js';
import { writeRenderMapVisitor } from '@codama/renderers-core';

codama.accept(writeRenderMapVisitor(getRenderMapVisitor(), 'src/generated'));
```

Note however that, if you are writing your own renderer, you should probably offer a higher-level visitor that includes this logic and also does some additional work such as deleting the base directory before writing the new content if it already exists.

For instance, the recommended way of using the `@codama/renderers-js` package is to use its default exported visitor which does exactly that.

```ts
import renderVisitor from '@codama/renderers-js';

codama.accept(renderVisitor('src/generated'));
```

Here's a simple example of how to set up the basis of a renderer from an existing `getRenderMapVisitor`.

```ts
import { deleteDirectory } from '@codama/fragments';
import { writeRenderMapVisitor } from '@codama/renderers-core';
import { rootNodeVisitor, visit } from '@codama/visitors-core';

type RenderOptions = {
    deleteFolderBeforeRendering?: boolean;
    // Any other options...
};

export function renderVisitor(path: string, options: RenderOptions = {}) {
    return rootNodeVisitor(async root => {
        // Delete existing generated folder.
        if (options.deleteFolderBeforeRendering ?? true) {
            deleteDirectory(path);
        }

        // Render the new files.
        visit(root, writeRenderMapVisitor(getRenderMapVisitor(options), path));
    });
}
```

### `writeIdlVisitor`

Writes the visited `RootNode` to a JSON file at the given path, creating intermediate directories as needed. This is typically used as a Codama CLI script to write the IDL back to a file after all `before` visitors have been applied. Like the filesystem helpers of `@codama/fragments`, it throws on runtimes other than Node.js.

```js
// codama.mjs
export default {
    idl: 'interface-idl.json',
    before: [...],
    scripts: {
        idl: { from: '@codama/renderers-core#writeIdlVisitor', args: ['idl.json'] },
    },
};
```
