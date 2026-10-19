---
'@codama/visitors-core': major
---

Stop exporting the test-only `NODE_TEST_PATHS` constant.

**BREAKING CHANGES**

**`NODE_TEST_PATHS` removed.** This test-only constant, mapping each node kind to its test fixture path, is no longer exported from `@codama/visitors-core`.

```diff
- import { NODE_TEST_PATHS } from '@codama/visitors-core';
```
