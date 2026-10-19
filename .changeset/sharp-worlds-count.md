---
'@codama/renderers-core': major
---

Stop re-exporting `@codama/fragments`, so this package only exports `writeRenderMapVisitor` and `writeIdlVisitor`.

**BREAKING CHANGES**

**Fragments APIs are no longer re-exported.** Fragment primitives, casing helpers, filesystem and path helpers, and the `RenderMap` data operations must be imported from `@codama/fragments` directly.

```diff
- import { addToRenderMap, createRenderMap, deleteDirectory, writeRenderMapVisitor } from '@codama/renderers-core';
+ import { addToRenderMap, createRenderMap, deleteDirectory } from '@codama/fragments';
+ import { writeRenderMapVisitor } from '@codama/renderers-core';
```
