---
'@codama/fragments': minor
---

Introduce `@codama/fragments`, a public package that bundles Codama's composable code-generation primitives. The root entrypoint exposes the language-agnostic core (`BaseFragment`, `createFragmentTemplate`, `mapFragmentContent`, `setFragmentContent`) plus a small framework of shared helpers: casing utilities (`camelCase`, `pascalCase`, `snakeCase`, `kebabCase`, `titleCase`, `capitalize`), filesystem and path helpers (`writeFile`, `readFile`, `joinPath`, `pathDirectory`, `relativePath`, …), and the `RenderMap` data structure with its pure data operations (`createRenderMap`, `addToRenderMap`, `mergeRenderMaps`, `mapRenderMapContent`, `writeRenderMap`, …). The casing helpers return plain `string`; the branded `CamelCaseString` / `PascalCaseString` / … types stay in `@codama/node-types` for spec-validation purposes.

JavaScript- and Rust-flavored `Fragment`, `ImportMap`, and `fragment` tagged-template helpers live under the `@codama/fragments/javascript` and `@codama/fragments/rust` subpaths. Both subpaths also expose `getDocblockFragment`, which now accepts `undefined` (in addition to `readonly string[]`) so generators can thread a node's optional `docs` attribute straight through without a ternary guard; the helper still returns `undefined` for empty or absent input, composing naturally with the `fragment` tagged template's optional-interpolation behaviour.

The package ships at `0.1.0` to signal pre-stability while the renderer stack settles around it.
