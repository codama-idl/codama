# Codama ➤ Fragments

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/fragments.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/fragments.svg?style=flat&label=%40codama%2Ffragments
[npm-url]: https://www.npmjs.com/package/@codama/fragments

This package provides the building blocks Codama renderers and code generators use to compose generated source. The core idea is the `Fragment` — a snippet of code paired with the imports it depends on — and the `fragment` tagged template that lets you stitch fragments together while propagating imports automatically.

## Installation

```sh
pnpm install @codama/fragments
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package. The language-agnostic core primitives are also re-exported from [`@codama/renderers-core`](../renderers-core) for backward compatibility with existing renderers; new code should import from `@codama/fragments` directly.

## What's a fragment?

When you generate code, you usually need to track two things in parallel: the source string itself, and the imports that source depends on. Threading imports through every helper that builds a piece of code becomes painful very quickly. Fragments solve this by carrying both pieces together.

A fragment, at minimum, is just an object with a `content` string. Each language flavor — JavaScript or Rust — extends this with an `ImportMap`, a symbolic record of what the content imports.

```ts
import { fragment, use } from '@codama/fragments/javascript';

const pubkey = use('type Address', '@solana/kit');
const interfaceFragment = fragment`
export interface Account {
    readonly owner: ${pubkey};
}
`;

console.log(interfaceFragment.content);
// export interface Account {
//     readonly owner: Address;
// }

console.log(interfaceFragment.imports);
// Map { '@solana/kit' => Map { 'Address' => { ..., isType: true } } }
```

Notice that `pubkey` was a small fragment carrying both the identifier `Address` and an import for it. When `pubkey` was interpolated into `interfaceFragment`, both pieces propagated upwards — the outer fragment ended up with the right content **and** with the import already attached.

That propagation is the whole point. You can build a fragment for a single field, compose it into a fragment for a struct, compose that into a fragment for a file, and only at the very end stringify the imports into actual `import { … } from '…';` (or `use foo::Bar;`) lines.

## Subpaths

The package exposes three subpaths so the JavaScript and Rust flavors don't clash on names like `Fragment`, `ImportMap`, or `fragment`.

```ts
// Root: language-agnostic core primitives only.
import type { BaseFragment } from '@codama/fragments';
import { createFragmentTemplate } from '@codama/fragments';

// JavaScript / TypeScript flavor.
import { fragment, use } from '@codama/fragments/javascript';

// Rust flavor.
import { addFragmentImports, fragment } from '@codama/fragments/rust';
```

If you're writing a renderer that emits JavaScript or TypeScript, you'll spend most of your time in `@codama/fragments/javascript`. If you're emitting Rust, in `@codama/fragments/rust`. Each subpath re-exports the core too, so a single import per file is enough.

## Core primitives

The root entrypoint contains a handful of language-agnostic primitives. Most renderers won't import from here directly — the language subpaths re-export everything — but if you're building your own fragment flavor (for a new target language, for example), this is where you start.

### `BaseFragment`

The minimal shape every flavored fragment extends. It only requires a `content` string; flavored fragments layer on additional fields like an import map.

```ts
import type { BaseFragment } from '@codama/fragments';

type MyFragment = BaseFragment & Readonly<{ tags: ReadonlySet<string> }>;
```

### `createFragmentTemplate`

The generic engine behind every flavor's `fragment` tagged template. You only need this when defining a new flavor: pass it the template parts, the items, an `isFragment` predicate, and a `mergeFragments` function. Everything else is handled for you.

```ts
import { createFragmentTemplate } from '@codama/fragments';

function fragment(template: TemplateStringsArray, ...items: unknown[]): MyFragment {
    return createFragmentTemplate(template, items, isMyFragment, mergeMyFragments);
}
```

### `mapFragmentContent` and `mapFragmentContentAsync`

Apply a content transformation while preserving every other field on the fragment.

```ts
import { mapFragmentContent } from '@codama/fragments';

const upper = mapFragmentContent(myFragment, content => content.toUpperCase());
```

An async variant is available for transformations that return promises (e.g. running Prettier on the content).

```ts
import { mapFragmentContentAsync } from '@codama/fragments';

const formatted = await mapFragmentContentAsync(myFragment, formatWithPrettier);
```

### `setFragmentContent`

Replace a fragment's content outright.

```ts
import { setFragmentContent } from '@codama/fragments';

const replaced = setFragmentContent(myFragment, '/* removed */');
```

## JavaScript flavor

`@codama/fragments/javascript` provides the concrete machinery for emitting TypeScript and JavaScript source.

### Composing JavaScript fragments

The `fragment` tagged template builds a fragment from a string template. Interpolated values that are themselves fragments get inlined and contribute their imports; primitives are coerced to strings.

```ts
import { fragment } from '@codama/fragments/javascript';

const greeting = fragment`hello ${'world'}`;
// greeting.content: 'hello world'
// greeting.imports.size: 0
```

When you need a fragment that references an imported identifier, the `use` helper is the shortcut. It accepts the same shorthand TypeScript accepts inside an `import { … }` block — bare names, `type` prefixes, and `as` aliases all work.

```ts
import { fragment, use } from '@codama/fragments/javascript';

const address = use('type Address', '@solana/kit');
const owner = use('PublicKey as PK', '@solana/kit');

const struct = fragment`
export interface Owner {
    readonly address: ${address};
    readonly pubkey: ${owner};
}
`;
```

Both interpolated fragments propagated their imports into `struct`. The outer fragment's import map will now have one entry for `@solana/kit` containing both `Address` (as a type-only import) and `PublicKey as PK`.

### Common helpers

Two small helpers cover the most repetitive bits of code generators.

`getDocblockFragment(lines)` builds a JSDoc block from an array of lines. Empty input returns `undefined`, which composes naturally with the `fragment` tag (interpolated `undefined` renders as the empty string), so optional documentation can be threaded through without explicit checks. Any `*/` sequences inside the lines are silently defanged so user-supplied content cannot accidentally close the comment early.

```ts
import { fragment, getDocblockFragment } from '@codama/fragments/javascript';

const docs = getDocblockFragment(['Greets the user.', '', 'Returns nothing.']);
const fn = fragment`${docs}\nexport function greet(name: string): void {}`;
// /**
//  * Greets the user.
//  *
//  * Returns nothing.
//  */
// export function greet(name: string): void {}
```

`getExportAllFragment(module)` builds a re-export line. The fragment carries no imports — `export * from` only forwards bindings out, it does not bring `module` into local scope.

```ts
import { getExportAllFragment } from '@codama/fragments/javascript';

getExportAllFragment('./accounts').content;
// export * from './accounts';
```

### The JavaScript `ImportMap`

The JavaScript `ImportMap` is a frozen, immutable `ReadonlyMap<Module, ReadonlyMap<UsedIdentifier, ImportInfo>>`. The outer key is the source module (e.g. `'@solana/kit'`), and the inner key is the identifier as it appears in the consuming code (after aliasing). Every operation returns a new map — there are no methods or mutation.

The shorthand strings the API accepts follow TypeScript's own:

| Input               | Imported identifier | Used identifier | Type-only? |
| ------------------- | ------------------- | --------------- | ---------- |
| `'Foo'`             | `Foo`               | `Foo`           | no         |
| `'type Foo'`        | `Foo`               | `Foo`           | yes        |
| `'Foo as Bar'`      | `Foo`               | `Bar`           | no         |
| `'type Foo as Bar'` | `Foo`               | `Bar`           | yes        |

### Building import maps

#### `createImportMap`

Returns an empty frozen map.

```ts
import { createImportMap } from '@codama/fragments/javascript';

const map = createImportMap();
```

#### `addToImportMap`

Returns a new map with extra identifiers attached to a module. When the same identifier appears as both a value and a type-only import — anywhere in a single batch or across merged maps — the value form wins.

```ts
import { addToImportMap, createImportMap } from '@codama/fragments/javascript';

let map = createImportMap();
map = addToImportMap(map, '@solana/kit', ['Address', 'type SignerKey']);
map = addToImportMap(map, '../shared', ['CamelCaseString']);
```

#### `removeFromImportMap`

Drops identifiers from a module entry. If no identifiers remain, the module entry itself is removed.

```ts
import { removeFromImportMap } from '@codama/fragments/javascript';

const trimmed = removeFromImportMap(map, '@solana/kit', ['SignerKey']);
```

#### `mergeImportMaps`

Combines multiple maps into one, applying the same value-wins rule on identifier conflicts.

```ts
import { mergeImportMaps } from '@codama/fragments/javascript';

const merged = mergeImportMaps([mapA, mapB, mapC]);
```

#### `parseImportInput`

If you ever need to inspect the parsed shape of a shorthand string without putting it in a map, this is the underlying parser.

```ts
import { parseImportInput } from '@codama/fragments/javascript';

parseImportInput('type Foo as Bar');
// { importedIdentifier: 'Foo', usedIdentifier: 'Bar', isType: true }
```

### Attaching imports to a fragment

The fragment helpers mirror the import-map helpers, except they take a fragment and update its `imports` field in place (returning a new frozen fragment).

#### `addFragmentImports`

```ts
import { addFragmentImports, fragment } from '@codama/fragments/javascript';

let f = fragment`hello`;
f = addFragmentImports(f, '@solana/kit', ['type Address']);
```

#### `mergeFragmentImports`

Useful when you have a standalone import map (e.g. from a `getExternalDependencies` result) you want to fold into a fragment.

```ts
import { mergeFragmentImports } from '@codama/fragments/javascript';

const updated = mergeFragmentImports(fragment, [extraMapA, extraMapB]);
```

#### `removeFragmentImports`

```ts
import { removeFragmentImports } from '@codama/fragments/javascript';

const trimmed = removeFragmentImports(fragment, '@solana/kit', ['SignerKey']);
```

### Resolving symbolic modules

Renderers usually don't write the final module path everywhere. Instead, they accumulate imports under symbolic names like `'solanaAddresses'` or `'generatedAccounts'` and resolve those names to real specifiers at the very end. This keeps the rendering code decoupled from the consumer's package layout.

#### `resolveImportMap`

Replaces the keys of a map according to the entries of a dependency record. Keys not present in the record are kept as-is. When two source modules resolve to the same target, their inner identifier maps are merged automatically.

```ts
import { resolveImportMap } from '@codama/fragments/javascript';

const resolved = resolveImportMap(map, {
    solanaAddresses: '@solana/kit',
    generatedAccounts: '../accounts',
});
```

#### `getExternalDependencies`

Returns the set of root package names referenced by an import map (after resolution). For scoped packages, the scope is included; for relative imports, nothing is reported. Useful when a renderer needs to sync a generated `package.json` with the imports it actually emitted.

```ts
import { getExternalDependencies } from '@codama/fragments/javascript';

const externals = getExternalDependencies(map, dependencyMap);
// Set { '@solana/kit', '@codama/spec' }
```

#### `importMapToString`

Renders the map as a block of `import { … } from '…';` lines. The dependency record is applied first, then non-relative paths are listed before relative ones, identifiers are alphabetized within each module, and a block-level `import type { … }` form is used when every identifier on the line is type-only.

```ts
import { importMapToString } from '@codama/fragments/javascript';

console.log(importMapToString(map, { solanaAddresses: '@solana/kit' }));
// import type { Address } from '@solana/kit';
// import { CamelCaseString } from '../shared';
```

## Rust flavor

`@codama/fragments/rust` mirrors the JavaScript flavor for emitting Rust source. The shape of the import map is different to match Rust's `use` syntax, but the operations follow the same naming and immutability discipline.

### Composing Rust fragments

The `fragment` tagged template behaves the same way as on the JavaScript side: interpolated fragments propagate their imports, primitives are coerced to strings.

```ts
import { fragment } from '@codama/fragments/rust';

const struct = fragment`
pub struct AccountNode {
    pub pubkey: Pubkey,
}
`;
```

Unlike the JavaScript flavor, there is no `use(input, module)` helper. Rust references identifiers inline by their full `::`-qualified path, so building content and attaching imports happen in two steps: write the content with `fragment`, then attach imports with `addFragmentImports`.

```ts
import { addFragmentImports, fragment } from '@codama/fragments/rust';

let body = fragment`
pub struct AccountNode {
    pub pubkey: Pubkey,
}
`;
body = addFragmentImports(body, ['solana_program::pubkey::Pubkey']);
```

When you need an alias, use `addFragmentImportAlias`.

```ts
import { addFragmentImportAlias, addFragmentImports, fragment } from '@codama/fragments/rust';

let body = fragment`pub fn fail() -> ProgError { ProgError::InvalidArgument }`;
body = addFragmentImports(body, ['solana_program::program_error::ProgramError']);
body = addFragmentImportAlias(body, 'solana_program::program_error::ProgramError', 'ProgError');
```

### Common helpers

`getDocblockFragment(lines)` builds a Rust doc-comment block. Empty input returns `undefined`, which composes naturally with the `fragment` tag (interpolated `undefined` renders as the empty string), so optional documentation can be threaded through without explicit checks. Pass `{ internal: true }` to emit inner doc comments (`//!`) instead of outer ones (`///`).

```ts
import { fragment, getDocblockFragment } from '@codama/fragments/rust';

const docs = getDocblockFragment(['Greets the user.', '', 'Returns nothing.']);
const fn = fragment`${docs}\npub fn greet(name: &str) {}`;
// /// Greets the user.
// ///
// /// Returns nothing.
// pub fn greet(name: &str) {}

const moduleDocs = getDocblockFragment(['Crate-level docs.'], { internal: true });
// //! Crate-level docs.
```

### The Rust `ImportMap`

The Rust `ImportMap` is a flat, frozen `ReadonlyMap<ImportPath, ImportInfo>`. The key is the fully-qualified `::`-separated path; the value is `{ importedPath, alias? }`. There is no per-module grouping the way JavaScript imports have, because each Rust `use` statement names a single path.

Like the JavaScript flavor, every operation returns a new map. There are no methods, no classes, no mutation.

### Building import maps

#### `createImportMap`

```ts
import { createImportMap } from '@codama/fragments/rust';

const map = createImportMap();
```

#### `addToImportMap`

Appends one or more paths. Accepts a single string, an array, or a `Set`. Paths already present in the map are skipped, so any existing aliases are preserved.

```ts
import { addToImportMap, createImportMap } from '@codama/fragments/rust';

let map = createImportMap();
map = addToImportMap(map, ['borsh::BorshDeserialize', 'borsh::BorshSerialize']);
map = addToImportMap(map, 'solana_program::pubkey::Pubkey');
```

#### `addAliasToImportMap`

Records an alias for a path. If the path isn't yet imported, it is added; if it's already present, the alias replaces any existing one.

```ts
import { addAliasToImportMap } from '@codama/fragments/rust';

const aliased = addAliasToImportMap(map, 'solana_program::program_error::ProgramError', 'ProgError');
```

#### `removeFromImportMap`

```ts
import { removeFromImportMap } from '@codama/fragments/rust';

const trimmed = removeFromImportMap(map, 'borsh::BorshDeserialize');
```

#### `mergeImportMaps`

Combines multiple maps. When the same path appears in more than one map, the latest occurrence wins on alias conflicts.

```ts
import { mergeImportMaps } from '@codama/fragments/rust';

const merged = mergeImportMaps([mapA, mapB]);
```

### Attaching imports to a fragment

#### `addFragmentImports`

```ts
import { addFragmentImports, fragment } from '@codama/fragments/rust';

let f = fragment`Pubkey`;
f = addFragmentImports(f, 'solana_program::pubkey::Pubkey');
```

#### `addFragmentImportAlias`

```ts
import { addFragmentImportAlias } from '@codama/fragments/rust';

const aliased = addFragmentImportAlias(f, 'solana_program::pubkey::Pubkey', 'Pk');
```

#### `mergeFragmentImports`

```ts
import { mergeFragmentImports } from '@codama/fragments/rust';

const updated = mergeFragmentImports(f, [extraMap]);
```

#### `removeFragmentImports`

```ts
import { removeFragmentImports } from '@codama/fragments/rust';

const trimmed = removeFragmentImports(f, 'borsh::BorshDeserialize');
```

### Resolving symbolic prefixes

Where the JavaScript flavor resolves entire module names, the Rust flavor resolves `::`-prefixes. This matches how Rust crate paths compose: a renderer might accumulate imports under `'generated::accounts::Foo'` and resolve `generated` to `crate::generated` at the end.

#### `resolveImportMap`

```ts
import { resolveImportMap } from '@codama/fragments/rust';

const resolved = resolveImportMap(map, { generated: 'crate::generated' });
// 'generated::accounts::Foo' -> 'crate::generated::accounts::Foo'
```

#### `getExternalDependencies`

Returns the set of top-level crate names referenced by the map after resolution. Rust's standard-library crates and crate-local prefixes are filtered out via `RUST_CORE_IMPORTS` (`std`, `crate`, `self`, `super`, `core`, `alloc`, `clippy`).

```ts
import { getExternalDependencies } from '@codama/fragments/rust';

const externals = getExternalDependencies(map, { generated: 'crate::generated' });
// Set { 'borsh', 'solana_program' }
```

#### `importMapToString`

Renders the map as a block of `use foo::Bar;` (and `use foo::Bar as Baz;`) lines, alphabetized for stable diffs and resolved against the dependency record.

```ts
import { importMapToString } from '@codama/fragments/rust';

console.log(importMapToString(map, { generated: 'crate::generated' }));
// use borsh::BorshSerialize;
// use crate::generated::accounts::Foo;
// use solana_program::pubkey::Pubkey;
```

## Putting it all together

Here's a tiny end-to-end example: a generator that emits a TypeScript interface for an account, given the account's name and the type of its `owner` field.

```ts
import { fragment, importMapToString, use } from '@codama/fragments/javascript';

function emitAccountInterface(name: string, ownerModule: string): string {
    const owner = use(`type ${name}OwnerKey`, ownerModule);
    const body = fragment`
export interface ${name}Account {
    readonly owner: ${owner};
}
`;
    const importBlock = importMapToString(body.imports);
    return `${importBlock}\n\n${body.content.trim()}\n`;
}

console.log(emitAccountInterface('Mint', '@solana/kit'));
// import type { MintOwnerKey } from '@solana/kit';
//
// export interface MintAccount {
//     readonly owner: MintOwnerKey;
// }
```

The interesting bit is what we _didn't_ have to do: at no point did `emitAccountInterface` keep a list of imports next to the content. The `use` helper attached the import to a small fragment; interpolation propagated it; `importMapToString` rendered it at the end.

Real generators take this further. They build dozens of small fragments per file, compose them into pages, and use `resolveImportMap` to translate symbolic module names into the consumer's actual package layout. The same patterns apply on the Rust side — replace `use` with explicit `addFragmentImports` calls and `importMapToString` will emit `use foo::Bar;` lines instead.

## Related packages

- [`@codama/renderers-core`](../renderers-core) — re-exports the language-agnostic core for backward compatibility with existing renderers.
