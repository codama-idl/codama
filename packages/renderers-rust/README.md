# Kinobi ➤ Renderers ➤ Rust

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/renderers-rust.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/renderers-rust.svg?style=flat&label=%40kinobi-so%2Frenderers-rust
[npm-url]: https://www.npmjs.com/package/@kinobi-so/renderers-rust

This package generates Rust clients from your Kinobi IDLs.

## Installation

```sh
pnpm install @kinobi-so/renderers-rust
```

> [!NOTE]
> This package is **not** included in the main [`kinobi`](../library) package.
>
> However, note that the [`renderers`](../renderers) package re-exports the `renderVisitor` function of this package as `renderRustVisitor`.

## Usage

Once you have a Kinobi IDL, you can use the `renderVisitor` of this package to generate Rust clients. You will need to provide the base directory where the generated files will be saved and an optional set of options to customize the output.

```ts
// node ./kinobi.mjs
import { renderVisitor } from '@kinobi-so/renderers-rust';

const pathToGeneratedFolder = path.join(__dirname, 'clients', 'rust', 'src', 'generated');
const options = {}; // See below.
kinobi.accept(renderVisitor(pathToGeneratedFolder, options));
```

## Options

The `renderVisitor` accepts the following options.

| Name                          | Type                                                                                                  | Default     | Description                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deleteFolderBeforeRendering` | `boolean`                                                                                             | `true`      | Whether the base directory should be cleaned before generating new files.                                                                                                                        |
| `formatCode`                  | `boolean`                                                                                             | `false`     | Whether we should use `cargo fmt` to format the generated code. When set to `true`, the `crateFolder` option must be provided.                                                                   |
| `toolchain`                   | `string`                                                                                              | `"+stable"` | The toolchain to use when formatting the generated code.                                                                                                                                         |
| `crateFolder`                 | `string`                                                                                              | none        | The path to the root folder of the Rust crate. This option is required when `formatCode` is set to `true`.                                                                                       |
| `linkOverrides`               | `Record<'accounts' \| 'definedTypes' \| 'pdas' \| 'programs' \| 'resolvers', Record<string, string>>` | `{}`        | A object that overrides the import path of link nodes. For instance, `{ definedTypes: { counter: 'hooked' } }` uses the `hooked` folder to import any link node referring to the `counter` type. |
| `dependencyMap`               | `Record<string, string>`                                                                              | `{}`        | A mapping between import aliases and their actual crate name or path in Rust.                                                                                                                    |
| `renderParentInstructions`    | `boolean`                                                                                             | `false`     | When using nested instructions, whether the parent instructions should also be rendered. When set to `false` (default), only the instruction leaves are being rendered.                          |
