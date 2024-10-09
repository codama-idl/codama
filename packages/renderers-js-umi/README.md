# Codama ➤ Renderers ➤ JavaScript Umi

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/renderers-js-umi.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/renderers-js-umi.svg?style=flat&label=%40codama%2Frenderers-js-umi
[npm-url]: https://www.npmjs.com/package/@codama/renderers-js-umi

This package generates JavaScript clients from your Codama IDLs. The generated clients are compatible with Metaplex's [Umi framework](https://github.com/metaplex-foundation/umi).

## Installation

```sh
pnpm install @codama/renderers-js-umi
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.
>
> However, note that the [`renderers`](../renderers) package re-exports the `renderVisitor` function of this package as `renderJavaScriptUmiVisitor`.

## Usage

Once you have a Codama IDL, you can use the `renderVisitor` of this package to generate JavaScript clients compatible with Umi. You will need to provide the base directory where the generated files will be saved and an optional set of options to customize the output.

```ts
// node ./codama.mjs
import { renderVisitor } from '@codama/renderers-js-umi';

const pathToGeneratedFolder = path.join(__dirname, 'clients', 'js', 'src', 'generated');
const options = {}; // See below.
codama.accept(renderVisitor(pathToGeneratedFolder, options));
```

## Options

The `renderVisitor` accepts the following options.

| Name                          | Type                                                                                                                    | Default   | Description                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deleteFolderBeforeRendering` | `boolean`                                                                                                               | `true`    | Whether the base directory should be cleaned before generating new files.                                                                                                                        |
| `formatCode`                  | `boolean`                                                                                                               | `true`    | Whether we should use Prettier to format the generated code.                                                                                                                                     |
| `prettierOptions`             | `PrettierOptions`                                                                                                       | `{}`      | The options to use when formatting the code using Prettier.                                                                                                                                      |
| `throwLevel`                  | `'debug' \| 'trace' \| 'info' \| 'warn' \| 'error'`                                                                     | `'error'` | When validating the Codama IDL, the level at which the validation should throw an error.                                                                                                         |
| `customAccountData`           | `string[]`                                                                                                              | `[]`      | The names of all `AccountNodes` whose data should be manually written in JavaScript.                                                                                                             |
| `customInstructionData`       | `string[]`                                                                                                              | `[]`      | The names of all `InstructionNodes` whose data should be manually written in JavaScript.                                                                                                         |
| `linkOverrides`               | `Record<'accounts' \| 'definedTypes' \| 'instructions' \| 'pdas' \| 'programs' \| 'resolvers', Record<string, string>>` | `{}`      | A object that overrides the import path of link nodes. For instance, `{ definedTypes: { counter: 'hooked' } }` uses the `hooked` folder to import any link node referring to the `counter` type. |
| `dependencyMap`               | `Record<string, string>`                                                                                                | `{}`      | A mapping between import aliases and their actual package name or path in JavaScript.                                                                                                            |
| `internalNodes`               | `string[]`                                                                                                              | `[]`      | The names of all nodes that should be generated but not exported by the `index.ts` files.                                                                                                        |
| `nonScalarEnums`              | `string[]`                                                                                                              | `[]`      | The names of enum variants with no data that should be treated as a data union instead of a native `enum` type. This is only useful if you are referencing an enum value in your Codama IDL.     |
| `renderParentInstructions`    | `boolean`                                                                                                               | `false`   | When using nested instructions, whether the parent instructions should also be rendered. When set to `false` (default), only the instruction leaves are being rendered.                          |
