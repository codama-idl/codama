# Codama ➤ Renderers ➤ Core

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/renderers-core.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/renderers-core.svg?style=flat&label=%40codama%2Frenderers-core
[npm-url]: https://www.npmjs.com/package/@codama/renderers-core

This package provides the core utility for generating clients from Codama IDLs. Its aim is mainly to provide helpers for other renderer packages such as [`@codama/renderers-js`](https://github.com/codama-idl/renderers-js) and [`@codama/renderers-rust`](https://github.com/codama-idl/renderers-rust).

## Installation

```sh
pnpm install @codama/renderers-core
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Filesystem wrappers

This package offers several helper functions that delegate to the native Filesystem API — i.e. `node:fs` — when using the Node.js runtime. However, in any other environment — such as the browser — these functions will throw a `CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE` error as a Filesystem API is not available. This enables us to import renderers regardless of the runtime environment.

### `createDirectory`

Creates a directory at the given path, recursively.

```ts
createDirectory(newDirectoryPath);
```

### `deleteDirectory`

Deletes a directory, recursively, if it exists.

```ts
deleteDirectory(directoryPath);
```

### `writeFile`

Creates a new file at the given path with the given content. Creates its parent directory, recursively, if it does not exist.

```ts
writeFile(filePath, content);
```

### `readFile`

Reads the UTF-8 content of a file as a string.

```ts
const content = readFile(filePath);
```

### `readJson`

Reads the UTF-8 content of a file as a JSON object.

```ts
const json = readJson<MyJsonDefinition>(filePath);
```

## Path wrappers

This package also offers several `path` helpers that delegate to the native `node:path` module when using the Node.js runtime but provide a fallback implementation when using any other runtime.

### `joinPath`

Joins multiple path segments into a single path.

```ts
const path = joinPath('path', 'to', 'my', 'file.ts');
```

### `pathDirectory`

Returns the parent directory of a given path.

```ts
const parentPath = pathDirectory(path);
```

## Fragments

The concept of fragments is commonly used in Codama renderers as a way to combine a piece of code with any context that is relevant to that piece of code. For instance, a fragment may include a dependency map that lists all the module imports required by that piece of code.

Since fragments vary from one renderer to another, this package cannot provide a one-size-fits-all `Fragment` type. Instead, it provides some base types and utility functions that can be used to build more specific fragment types.

### `BaseFragment`

The `BaseFragment` type is an object that includes a `content` string. Renderers may extend this type to include any additional context they need.

```ts
type Fragment = BaseFragment & Readonly<{ importMap: ImportMap }>;
```

### `mapFragmentContent`

The `mapFragmentContent` helper can be used to transform the `content` of a fragment while preserving the rest of its context.

```ts
const updatedFragment = mapFragmentContent(fragment, c => `/** This is a fragment. */\n${c}`);
```

### `setFragmentContent`

The `setFragmentContent` helper can be used to replace the `content` of a fragment while preserving the rest of its context.

```ts
const updatedFragment = setFragmentContent(fragment, '[redacted]');
```

### `createFragmentTemplate`

The `createFragmentTemplate` helper can be used to create [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) functions. For this, you need to provide a function that can merge multiple fragments together and a function that can identify fragments from other values.

```ts
function fragment(template: TemplateStringsArray, ...items: unknown[]): Fragment {
    return createFragmentTemplate(template, items, isFragment, mergeFragments);
}
const apple = fragment`apple`;
const banana = fragment`banana`;
const fruits = fragment`${apple}, ${banana}`;
```

## Render maps

This package also provides a `RenderMap` type and a handful of helpers to work with it.

A `RenderMap` is a utility type that helps manage a collection of files to be rendered. It acts as a middleman between the logic that generates the content and the logic that writes the content to the filesystem. As such, it provides a way to access the generated content outside an environment that supports the Filesystem API — such as the browser. It also helps us write tests about the generated code without having to write it to the filesystem.

### Creating new `RenderMaps`

You can use the `createRenderMap` function with no arguments to create a new empty `RenderMap`.

```ts
const renderMap = createRenderMap();
```

You may provide the path and content of a file to create a `RenderMap` with a single file.

```ts
const renderMap = createRenderMap('path/to/file.ts', 'file content');
```

You may also provide an object mapping file paths to their content to create a `RenderMap` with multiple files.

```ts
const renderMap = createRenderMap({
    'path/to/file.ts': 'file content',
    'path/to/another/file.ts': 'another file content',
});
```

Finally, note that any time a `string` is expected as the content of a file, you may also provide a `BaseFragment` instead. In that case, only the `content` field of the fragment will be used.

```ts
const myFragment: BaseFragment = { content: 'file content' };

// From a single file.
createRenderMap('path/to/file.ts', myFragment);

// From multiple files.
createRenderMap({
    'path/to/file.ts': myFragment,
    'path/to/another/file.ts': 'another file content',
});
```

Note that when setting paths inside a `RenderMap`, they should be relative to the base directory that will be provided when writing the `RenderMap` to the filesystem. For instance, if we decide to use `src/generated` as the base directory when writing the `RenderMap`, then using a path such as `accounts/mint.ts` will result in the file being written to `src/generated/accounts/mint.ts`.

### Adding content to a `RenderMap`

To add content to a `RenderMap`, you may use the `addToRenderMap` function by providing the path and the content of the file to be added. Note that, here as well, the path should be relative to the base directory that will be provided when writing the `RenderMap` to the filesystem.

```ts
const updatedRenderMap = addToRenderMap(renderMap, 'path/to/file.ts', 'file content');
```

Since `RenderMaps` are immutable, you may want to use the `pipe` function from `@codama/visitors-core` — also available in `codama` — to chain multiple updates together.

```ts
const renderMap = pipe(
    createRenderMap(),
    m => addToRenderMap(m, 'programs/token.ts', 'export type TokenProgram = { /* ... */ }'),
    m => addToRenderMap(m, 'accounts/mint.ts', 'export type MintAccount = { /* ... */ }'),
    m => addToRenderMap(m, 'instructions/transfer.ts', 'export function getTransferInstruction = { /* ... */ }'),
);
```

### Merging multiple `RenderMaps`

You may use the `mergeRenderMaps` helper to combine multiple `RenderMap` instances into a single one. If two `RenderMap` instances contain the same file path, the content from the latter will overwrite the content from the former.

```ts
const renderMapA = createRenderMap('programs/programA.ts', 'export type ProgramA = { /* ... */ }');
const renderMapB = createRenderMap('programs/programB.ts', 'export type ProgramB = { /* ... */ }');
const mergedRenderMap = mergeRenderMaps(renderMapA, renderMapB);
```

### Removing content from a `RenderMap`

To remove files from a `RenderMap`, simply use the `removeFromRenderMap` function by providing the relative path of the file to be removed.

```ts
const updatedRenderMap = removeFromRenderMap(renderMap, 'programs/token.ts');
```

### Accessing content from a `RenderMap`

The `RenderMap` type is essentially a JavaScript `Map` so you can use all the methods available on the `Map` prototype. Therefore, you may use the `get` method to access the content of a file from its relative path.

```ts
const content: string | undefined = renderMap.get('programs/token.ts');
```

However, this may return `undefined` if the file does not exist on the `RenderMap`. If you want to access the content of a file and throw an error if it does not exist, you can use the `getFromRenderMap` helper instead.

```ts
const content: string = getFromRenderMap(renderMap, 'programs/token.ts');
```

You may also use the `renderMapContains` helper to check if the provided file content exists in the `RenderMap` at the given path. The expected file content can be a string or a regular expression.

```ts
const hasTokenProgram = renderMapContains(renderMap, 'programs/token.ts', 'export type TokenProgram = { /* ... */ }');
const hasMintAccount = renderMapContains(renderMap, 'programs/token.ts', /MintAccount/);
```

### Transforming content from a `RenderMap`

To map the content of all files inside a `RenderMap`, you can use the `mapRenderMapContent` function. This method accepts a function that takes the content of a file and returns a new content.

```ts
const updatedRenderMap = mapRenderMapContent(renderMap, c => `/** Prefix for all files */\n\n${c}`);
```

An asynchronous version of this function called `mapRenderMapContentAsync` is also available in case the transformation function needs to be asynchronous.

```ts
const updatedRenderMap = await mapRenderMapContentAsync(renderMap, async content => {
    const transformedContent = await someAsyncFunction(content);
    return `/** Prefix for all files */\n\n${transformedContent}`;
});
```

### Writing a `RenderMap` to the filesystem

When the `RenderMap` is ready to be written to the filesystem, you can use the `writeRenderMap` helper by providing the base directory where all files should be written. All paths inside the `RenderMap` will be appended to this base directory.

```ts
const renderMap = createRenderMap({
    'programs/token.ts': 'export type TokenProgram = { /* ... */ }',
    'accounts/mint.ts': 'export type MintAccount = { /* ... */ }',
});

writeRenderMap(renderMap, 'src/generated');
// In this example, files will be written to:
// - src/generated/programs/token.ts
// - src/generated/accounts/mint.ts.
```

### Using visitors

When building renderers, you will most likely create a visitor that traverses the Codama IDL and returns a `RenderMap`. That way, you can test the generated content without having to write it to the filesystem. For instance, the [`@codama/renderers-js`](https://github.com/codama-idl/renderers-js) package exports a `getRenderMapVisitor` function that does just that.

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

For instance, the recommended way of using the `@codama/renderers-js` package is to use its default exported visitor which does exactly that.

```ts
import renderVisitor from '@codama/renderers-js';

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
