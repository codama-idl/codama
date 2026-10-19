---
'@codama/dynamic-client': major
---

Move `generateClientTypes` to a new Node-only `@codama/dynamic-client/codegen` subpath so that the main entry, and thus browser and React Native bundles, no longer pull in the Node-only code generation of `@codama/dynamic-address-resolution/codegen` and `@codama/dynamic-instructions/codegen`.

**BREAKING CHANGES**

**`generateClientTypes` moved to `@codama/dynamic-client/codegen`.** It is no longer exported from the main entry.

```diff
- import { generateClientTypes } from '@codama/dynamic-client';
+ import { generateClientTypes } from '@codama/dynamic-client/codegen';
```
