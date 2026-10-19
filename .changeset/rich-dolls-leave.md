---
'@codama/visitors-core': major
---

Fix `ProvidedScope` resolving the fallback of a nested injection before the injection itself, which reported the fallback's key as missing even when the injection's own key was provided. Also clear the `LinkableDictionary` before each top-level visit of `recordLinkablesOnFirstVisitVisitor`, so a reused visitor no longer resolves links against previously visited trees, and add a `LinkableDictionary.clear()` method.

**BREAKING CHANGES**

**`NODE_TEST_PATHS` removed.** This test-only constant, mapping each node kind to its test fixture path, is no longer exported from `@codama/visitors-core`.

```diff
- import { NODE_TEST_PATHS } from '@codama/visitors-core';
```
