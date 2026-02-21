# Codama ➤ Runtime Utilities

This package provides runtime-safe filesystem and path utilities shared across Codama packages.
Its primary goal is to centralize interactions with Node.js–specific APIs while allowing Codama
packages (including renderers) to be imported in non-Node environments.

These utilities are primarily consumed by renderer packages such as [`@codama/renderers-js`](https://github.com/codama-idl/renderers-js) and [`@codama/renderers-rust`](https://github.com/codama-idl/renderers-rust).

## Installation

```sh
pnpm install @codama/runtime-utils
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Filesystem wrappers

This package offers several helper functions that delegate to the native Filesystem API — i.e. `node:fs` — when using the Node.js runtime. However, in any other environment — such as the browser — these functions will throw a `CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE` error as a Filesystem API is not available. This enables Codama packages (including renderers) to be imported regardless of the runtime environment.

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
