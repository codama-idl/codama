# Kinobi ➤ Renderers ➤ JavaScript Umi

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/renderers-js-umi.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/renderers-js-umi.svg?style=flat&label=%40kinobi-so%2Frenderers-js-umi
[npm-url]: https://www.npmjs.com/package/@kinobi-so/renderers-js-umi

This package generates JavaScript clients from your Kinobi IDLs. The generated clients are compatible with Metaplex's [Umi framework](https://github.com/metaplex-foundation/umi).

## Installation

```sh
pnpm install @kinobi-so/renderers-js-umi
```

> [!NOTE]
> This package is **not** included in the main [`kinobi`](../library) package.
>
> However, note that the [`renderers`](../renderers) package re-exports the `renderVisitor` function of this package as `renderJavaScriptUmiVisitor`.

## Usage

Once you have a Kinobi IDL, you can use the `renderVisitor` of this package to generate JavaScript clients compatible with Umi. You will need to provide the base directory where the generated files will be saved and an optional set of options to customize the output.

```ts
// node ./kinobi.mjs
import { renderVisitor } from '@kinobi-so/renderers-js-umi';

const pathToGeneratedFolder = path.join(__dirname, 'clients', 'js', 'src', 'generated');
const options = {}; // See below.
kinobi.accept(renderVisitor(pathToGeneratedFolder, options));
```

## Options

The `renderVisitor` accepts the following options.

| Name                          | Type                                                                                                  | Default   | Description                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deleteFolderBeforeRendering` | `boolean`                                                                                             | `true`    | Whether the base directory should be cleaned before generating new files.                                                                                                                        |
| `formatCode`                  | `boolean`                                                                                             | `true`    | Whether we should use Prettier to format the generated code.                                                                                                                                     |
| `prettierOptions`             | `PrettierOptions`                                                                                     | `{}`      | The options to use when formatting the code using Prettier.                                                                                                                                      |
| `throwLevel`                  | `'debug' \| 'trace' \| 'info' \| 'warn' \| 'error'`                                                   | `'error'` | When validating the Kinobi IDL, the level at which the validation should throw an error.                                                                                                         |
| `customAccountData`           | `string[]`                                                                                            | `[]`      | The names of all `AccountNodes` whose data should be manually written in JavaScript.                                                                                                             |
| `customInstructionData`       | `string[]`                                                                                            | `[]`      | The names of all `InstructionNodes` whose data should be manually written in JavaScript.                                                                                                         |
| `linkOverrides`               | `Record<'accounts' \| 'definedTypes' \| 'pdas' \| 'programs' \| 'resolvers', Record<string, string>>` | `{}`      | A object that overrides the import path of link nodes. For instance, `{ definedTypes: { counter: 'hooked' } }` uses the `hooked` folder to import any link node referring to the `counter` type. |
| `dependencyMap`               | `Record<string, string>`                                                                              | `{}`      | A mapping between import aliases and their actual package name or path in JavaScript.                                                                                                            |
| `internalNodes`               | `string[]`                                                                                            | `[]`      | The names of all nodes that should be generated but not exported by the `index.ts` files.                                                                                                        |
| `nonScalarEnums`              | `string[]`                                                                                            | `[]`      | The names of enum variants with no data that should be treated as a data union instead of a native `enum` type. This is only useful if you are referencing an enum value in your Kinobi IDL.     |
| `renderParentInstructions`    | `boolean`                                                                                             | `false`   | When using nested instructions, whether the parent instructions should also be rendered. When set to `false` (default), only the instruction leaves are being rendered.                          |
