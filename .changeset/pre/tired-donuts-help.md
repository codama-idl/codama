---
'@codama/fragments': major
---

Align the casing helpers with the word split of the Codama spec's casing-collision rule, expose them on their own under a new `@codama/fragments/casing` subpath (`capitalize`, `titleCase`, `pascalCase`, `camelCase`, `kebabCase`, `snakeCase`, also still exported from the root entrypoint), and sort the members of rendered JavaScript imports the way the `sort-imports` lint rule does.

**BREAKING CHANGES**

**Casing helpers split words like the spec.** `titleCase`, `pascalCase`, `camelCase`, `kebabCase` and `snakeCase` now split words on runs of non-alphanumeric characters (dropping empty words), between a lowercase letter or digit and an uppercase letter, and before the last capital of an acronym followed by a lowercase letter. Uppercase runs therefore stay whole instead of being split letter by letter, so generated names derived from such identifiers change.

```diff
- camelCase('HTTPServer'); // 'hTTPServer'
+ camelCase('HTTPServer'); // 'httpServer'
- snakeCase('getURL'); // 'get_u_r_l'
+ snakeCase('getURL'); // 'get_url'
- titleCase('UPPERCASED'); // 'U P P E R C A S E D'
+ titleCase('UPPERCASED'); // 'Uppercased'
```

**Generated import members are reordered.** `importMapToString` from `@codama/fragments/javascript` now sorts the members of each import by the name they are used under, ignoring case and any `type` prefix, instead of sorting the rendered strings.

```diff
- import { Baz, type Foo as Bar } from './foo';
+ import { type Foo as Bar, Baz } from './foo';
```
