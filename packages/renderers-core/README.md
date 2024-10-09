# Codama ➤ Renderers ➤ Core

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/renderers-core.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/renderers-core.svg?style=flat&label=%40kinobi-so%2Frenderers-core
[npm-url]: https://www.npmjs.com/package/@codama/renderers-core

This package provides the core utility for generating clients from Codama IDLs. Its aim is mainly to provide helpers for other renderer packages such as [`@codama/renderers-js`](../renderers-js) and [`@codama/renderers-rust`](../renderers-rust).

## Installation

```sh
pnpm install @codama/renderers-core
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Filesystem wrappers

This package offers several helper functions that delegate to the native Filesystem API — i.e. `node:fs` — when using the Node.js runtime. However, in any other environment — such as the browser — these functions will throw a `CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE` error as a Filesystem API is not available. This enables us to write renderers regardless of the runtime environment.

```ts
// Reads the UTF-8 content of a file as a JSON object.
const json = readJson<MyJsonDefinition>(filePath);

// Creates a directory at the given path, recursively.
createDirectory(newDirectoryPath);

// Deletes a directory, recursively, if it exists.
deleteDirectory(directoryPath);

// Creates a new file at the given path with the given content.
// Creates its parent directory, recursively, if it does not exist.
createFile(filePath, content);
```

## Render maps

The `RenderMap` class is a utility class that helps manage a collection of files to be rendered. It acts as a middleman between the logic that generates the content and the logic that writes the content to the filesystem. As such, it provides a way to access the generated content outside an environment that supports the Filesystem API — such as the browser. It also helps us write tests about the generated code without having to write it to the filesystem.

### Adding content to a `RenderMap`

The add content to a `RenderMap`, you can use the `add` method by providing a path and the content to be written to that path.

Note that the path should be **relative to the base directory** that will be provided when writing the `RenderMap` to the filesystem.

```ts
const renderMap = new RenderMap()
    .add('programs/token.ts', 'export type TokenProgram = { /* ... */ }')
    .add('accounts/mint.ts', 'export type MintAccount = { /* ... */ }')
    .add('instructions/transfer.ts', 'export function getTransferInstruction = { /* ... */ }');
```

Additionally, you can use the `mergeWith` method to merge multiple `RenderMap` instances together.

```ts
const renderMapA = new RenderMap().add('programs/programA.ts', 'export type ProgramA = { /* ... */ }');
const renderMapB = new RenderMap().add('programs/programB.ts', 'export type ProgramB = { /* ... */ }');
const renderMapC = new RenderMap().mergeWith(renderMapA, renderMapB);
```

### Removing content from a `RenderMap`

To remove files from a `RenderMap`, simply use the `remove` method by providing the relative path of the file to be removed.

```ts
renderMap.remove('programs/token.ts');
```

### Accessing content from a `RenderMap`

The `RenderMap` class provides several methods to access the content of the files it manages. The `get` method returns the content of a file from its relative path. If the file does not exist on the `RenderMap`, a `CODAMA_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND` error will be thrown.

```ts
const content: string = renderMap.get('programs/token.ts');
```

To safely access the content of a file without throwing an error, you can use the `safeGet` method. This method returns the content of a file from its relative path, or `undefined` if the file does not exist.

```ts
const content: string | undefined = renderMap.safeGet('programs/token.ts');
```

The `has` and `isEmpty` methods can also be used to verify the existence of files in the `RenderMap`.

```ts
const hasTokenProgram = renderMap.has('programs/token.ts');
const hasNoFiles = renderMap.isEmpty();
```

Finally, the `contains` method can be used to check if a file contains a specific string or matches a regular expression.

```ts
const hasTokenProgram = renderMap.contains('programs/token.ts', 'export type TokenProgram = { /* ... */ }');
const hasMintAccount = renderMap.contains('programs/token.ts', /MintAccount/);
```

### Tranforming content from a `RenderMap`

To map the content of files inside a `RenderMap`, you can use the `mapContent` method. This method accepts a function that takes the content of a file and returns a new content.

```ts
renderMap.mapContent(content => `/** Prefix for all files */\n\n${content}`);
```

An asynchronous version of this method called `mapContentAsync` is also available in case the transformation function needs to be asynchronous.

```ts
await renderMap.mapContentAsync(async content => {
    const transformedContent = await someAsyncFunction(content);
    return `/** Prefix for all files */\n\n${transformedContent}`;
});
```

### Writing a `RenderMap` to the filesystem

When the `RenderMap` is ready to be written to the filesystem, you can use the `write` method by providing the base directory where all files should be written. Any relative path provided by the `add` method will be appended to this base directory.

```ts
const renderMap = new RenderMap()
    .add('programs/token.ts', 'export type TokenProgram = { /* ... */ }')
    .add('accounts/mint.ts', 'export type MintAccount = { /* ... */ }');

renderMap.write('src/generated');
// In this example, files will be written to:
// - src/generated/programs/token.ts
// - src/generated/accounts/mint.ts.
```

### Using visitors

When building renderers, you will most likely create a visitor that traverses the Codama IDL and returns a `RenderMap`. That way, you can test the generated content without having to write it to the filesystem. For instance, the [`@codama/renderers-js`](../renderers-js) package exports a `getRenderMapVisitor` function that does just that.

```ts
import { getRenderMapVisitor } from '@codama/renderers-js';

const renderMap = codama.accept(getRenderMapVisitor());
```

If you have access to a visitor that returns a `RenderMap` — also described as `Visitor<RenderMap>` — then, you can wrap it inside the `writeRenderMapVisitor` to directly write the content to the filesystem at the given base directory.

```ts
import { getRenderMapVisitor } from '@codama/renderers-js';

codama.accept(writeRenderMapVisitor(getRenderMapVisitor(), 'src/generated'));
```

Note however that, if you are writing your own renderer, you should probably offer a higher-level visitor that includes this logic and also does some additional work such as deleting the base directory before writing the new content if it already exists.

For instance, the recommended way of using the `@codama/renderers-js` package is to use the following `renderVisitor` function.

```ts
import { renderVisitor } from '@codama/renderers-js';

codama.accept(renderVisitor('src/generated'));
```

Here's a simple example of how to set up the basis of a renderer from an existing `getRenderMapVisitor`.

```ts
import { deleteDirectory } from '@codama/renderers-core';
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
