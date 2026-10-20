---
'codama': major
---

Support Codama v2 IDLs and keep exporting the `camelCase`, `capitalize`, `kebabCase`, `pascalCase`, `snakeCase` and `titleCase` helpers, now re-exported from `@codama/fragments` since `@codama/nodes` no longer provides them.

**BREAKING CHANGES**

**1.x IDLs are rejected.** `createFromRoot` and `createFromJson` now expect IDLs on the 2.x major and throw a `CODAMA_ERROR__VERSION_MISMATCH` error for 1.x IDLs. Upgrade them first, either once with the new `codama upgrade` command or on the fly with `@codama/upgrade`.

```diff
+ import { upgradeFromJson } from '@codama/upgrade';
- const codama = createFromJson(v1Json);
+ const codama = createFromRoot(upgradeFromJson(v1Json));
```

**Casing helpers return plain strings.** The casing helpers return `string` rather than branded types such as `CamelCaseString`, and split words following the Codama v2 casing rules, e.g. `titleCase('HTTPServer')` now returns `Http Server`.
