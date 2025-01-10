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
| `anchorTraits`                | `boolean`                                                                                                               | `true`                  | Whether to generate Anchor traits `impl` for account types.                                                                                                                                      |

## Trait Options

The Rust renderer provides sensible default traits when generating the various Rust types you client will use. However, you may wish to configure these traits to better suit your needs. The `traitOptions` attribute is here to help you with that. Let's see the various settings it provides.

### Default traits

Using the `traitOptions` attribute, you may configure the default traits that will be applied to every Rust type. These default traits can be configured using 4 different attributes:

- `baseDefaults`: The default traits to implement for all types.
- `dataEnumDefaults`: The default traits to implement for all data enum types, in addition to the `baseDefaults` traits. Data enums are enums with at least one non-unit variant — e.g. `pub enum Command { Write(String), Quit }`.
- `scalarEnumDefaults`: The default traits to implement for all scalar enum types, in addition to the `baseDefaults` traits. Scalar enums are enums with unit variants only — e.g. `pub enum Feedback { Good, Bad }`.
- `structDefaults`: The default traits to implement for all struct types, in addition to the `baseDefaults` traits.

Note that you must provide the fully qualified name of the traits you provide (e.g. `serde::Serialize`). Here are the default values for these attributes:

```ts
const traitOptions = {
    baseDefaults: [
        'borsh::BorshSerialize',
        'borsh::BorshDeserialize',
        'serde::Serialize',
        'serde::Deserialize',
        'Clone',
        'Debug',
        'Eq',
        'PartialEq',
    ],
    dataEnumDefaults: [],
    scalarEnumDefaults: ['Copy', 'PartialOrd', 'Hash', 'num_derive::FromPrimitive'],
    structDefaults: [],
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

### Feature Flags

You may also configure which traits should be rendered under a feature flag by using the `featureFlags` attribute. This attribute is a map where the keys are feature flag names and the values are the traits that should be rendered under that feature flag. Here is an example:

```ts
const traitOptions = {
    featureFlags: { fruits: ['fruits::Apple', 'fruits::Banana'] },
};
```

Now, if at any point, we encounter a `fruits::Apple` or `fruits::Banana` trait to be rendered (either as default traits or as overridden traits), they will be rendered under the `fruits` feature flag. For instance:

```rust
#[cfg_attr(feature = "fruits", derive(fruits::Apple, fruits::Banana))]
```

By default, the `featureFlags` option is set to the following:

```ts
const traitOptions = {
    featureFlags: { serde: ['serde::Serialize', 'serde::Deserialize'] },
};
```

Note that for feature flags to be effective, they must be added to the `Cargo.toml` file of the generated Rust client.

### Using the Fully Qualified Name

By default, all traits are imported using the provided Fully Qualified Name which means their short name will be used within the `derive` attributes.

However, you may want to avoid importing these traits and use the Fully Qualified Name directly in the generated code. To do so, you may use the `useFullyQualifiedName` attribute of the `traitOptions` object by setting it to `true`:

```ts
const traitOptions = {
    useFullyQualifiedName: true,
};
```

Here is an example of rendered traits with this option set to `true` and `false` (which is the default):

```rust
// With `useFullyQualifiedName` set to `false` (default).
use serde::Serialize;
use serde::Deserialize;
// ...
#[derive(Serialize, Deserialize)]

// With `useFullyQualifiedName` set to `true`.
#[derive(serde::Serialize, serde::Deserialize)]
```

Note that any trait rendered under a feature flag will always use the Fully Qualified Name in order to ensure we only reference the trait when the feature is enabled.
