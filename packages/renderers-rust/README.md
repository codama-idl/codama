# Codama ➤ Renderers ➤ Rust

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/renderers-rust.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/renderers-rust.svg?style=flat&label=%40codama%2Frenderers-rust
[npm-url]: https://www.npmjs.com/package/@codama/renderers-rust

This package generates Rust clients from your Codama IDLs.

## Installation

```sh
pnpm install @codama/renderers-rust
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.
>
> However, note that the [`renderers`](../renderers) package re-exports the `renderVisitor` function of this package as `renderRustVisitor`.

## Usage

Once you have a Codama IDL, you can use the `renderVisitor` of this package to generate Rust clients. You will need to provide the base directory where the generated files will be saved and an optional set of options to customize the output.

```ts
// node ./codama.mjs
import { renderVisitor } from '@codama/renderers-rust';

const pathToGeneratedFolder = path.join(__dirname, 'clients', 'rust', 'src', 'generated');
const options = {}; // See below.
codama.accept(renderVisitor(pathToGeneratedFolder, options));
```

## Options

The `renderVisitor` accepts the following options.

| Name                          | Type                                                                                                                    | Default                 | Description                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deleteFolderBeforeRendering` | `boolean`                                                                                                               | `true`                  | Whether the base directory should be cleaned before generating new files.                                                                                                                        |
| `formatCode`                  | `boolean`                                                                                                               | `false`                 | Whether we should use `cargo fmt` to format the generated code. When set to `true`, the `crateFolder` option must be provided.                                                                   |
| `toolchain`                   | `string`                                                                                                                | `"+stable"`             | The toolchain to use when formatting the generated code.                                                                                                                                         |
| `crateFolder`                 | `string`                                                                                                                | none                    | The path to the root folder of the Rust crate. This option is required when `formatCode` is set to `true`.                                                                                       |
| `linkOverrides`               | `Record<'accounts' \| 'definedTypes' \| 'instructions' \| 'pdas' \| 'programs' \| 'resolvers', Record<string, string>>` | `{}`                    | A object that overrides the import path of link nodes. For instance, `{ definedTypes: { counter: 'hooked' } }` uses the `hooked` folder to import any link node referring to the `counter` type. |
| `dependencyMap`               | `Record<string, string>`                                                                                                | `{}`                    | A mapping between import aliases and their actual crate name or path in Rust.                                                                                                                    |
| `renderParentInstructions`    | `boolean`                                                                                                               | `false`                 | When using nested instructions, whether the parent instructions should also be rendered. When set to `false` (default), only the instruction leaves are being rendered.                          |
| `traitOptions`                | [`TraitOptions`](#trait-options)                                                                                        | `DEFAULT_TRAIT_OPTIONS` | A set of options that can be used to configure how traits are rendered for every Rust types. See [documentation below](#trait-options) for more information.                                     |

## Trait Options

The Rust renderer provides sensible default traits when generating the various Rust types you client will use. However, you may wish to configure these traits to better suit your needs. The `traitOptions` attribute is here to help you with that. Let's see the various settings it provides.

### Default traits

Using the `traitOptions` attribute, you may configure the default traits that will be applied to every Rust type. These default traits can be configured using 4 different attributes:

-   `baseDefaults`: The default traits to implement for all types.
-   `enumDefaults`: The default traits to implement for all enum types, in addition to the `baseDefaults` traits.
-   `structDefaults`: The default traits to implement for all struct types, in addition to the `baseDefaults` traits.
-   `aliasDefaults`: The default traits to implement for all type aliases, in addition to the `baseDefaults` traits.

Note that you must provide the fully qualified name of the traits you provide (e.g. `serde::Serialize`). Here are the default values for these attributes:

```ts
const traitOptions = {
    aliasDefaults: [],
    baseDefaults: ['borsh::BorshSerialize', 'borsh::BorshDeserialize', 'Clone', 'Debug', 'Eq', 'PartialEq'],
    enumDefaults: ['Copy', 'PartialOrd', 'Hash', 'num_derive::FromPrimitive'],
    structDefaults: ['serde::Serialize', 'serde::Deserialize'],
};
```

### Overridden traits

In addition to configure the default traits, you may also override the traits for specific types. This will completely replace the default traits for the given type. To do so, you may use the `overrides` attribute of the `traitOptions` object.

This attribute is a map where the keys are the names of the types you want to override, and the values are the traits you want to apply to these types. Here is an example:

```ts
const traitOptions = {
    overrides: {
        myCustomType: ['Clone', 'my::custom::Trait', 'my::custom::OtherTrait'],
        myTypeWithNoTraits: [],
    },
};
```
