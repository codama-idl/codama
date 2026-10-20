---
'@codama/fragments': major
---

Let Rust import maps import a path under several local names, so merging a fragment that uses `crate::Mint` with one that uses it `as TokenMint` keeps both `use` statements instead of only the last one merged.

**BREAKING CHANGES**

**Rust import maps hold several local names per path.** The `ImportMap` of `@codama/fragments/rust` is now a `ReadonlyMap<ImportPath, ReadonlyMap<UsedIdentifier, ImportInfo>>`, mirroring the JavaScript flavour, and `ImportInfo` is `{ importedPath, usedIdentifier }` instead of `{ importedPath, alias? }`. A plain import is used under the last segment of its path.

```diff
- map.get('crate::Mint')?.alias; // 'TokenMint'
+ [...(map.get('crate::Mint')?.keys() ?? [])]; // ['Mint', 'TokenMint']
```

**Aliases are added, not replaced.** `addAliasToImportMap`, `addFragmentImportAlias` and `mergeImportMaps` keep every local name a path is imported under, and `importMapToString` renders one `use` statement per name. Adding a plain import and an alias of the same path now renders both.

```diff
  let map = addToImportMap(createImportMap(), 'crate::Mint');
  map = addAliasToImportMap(map, 'crate::Mint', 'TokenMint');
  importMapToString(map);
- // use crate::Mint as TokenMint;
+ // use crate::Mint as TokenMint;
+ // use crate::Mint;
```
