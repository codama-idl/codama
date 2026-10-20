---
'@codama/node-types': major
'@codama/nodes': major
'@codama/visitors': major
'@codama/visitors-core': major
'codama': major
---

Remove the deprecated node kind aliases, the `ProgramVersion` type and the duplicate node path formatters. Each has a canonical replacement that was already exported.

**BREAKING CHANGES**

**Node kind aliases removed.** The legacy `*_NODES` aliases of `@codama/nodes` are removed in favour of the `*_NODE_KINDS` constants generated from the spec.

```diff
- import { CONTEXTUAL_VALUE_NODES, COUNT_NODES, DISCRIMINATOR_NODES, INSTRUCTION_INPUT_VALUE_NODES } from '@codama/nodes';
- import { LINK_NODES, PDA_SEED_NODES, TYPE_NODES, VALUE_NODES } from '@codama/nodes';
+ import { CONTEXTUAL_VALUE_NODE_KINDS, COUNT_NODE_KINDS, DISCRIMINATOR_NODE_KINDS, INSTRUCTION_INPUT_VALUE_NODE_KINDS } from '@codama/nodes';
+ import { LINK_NODE_KINDS, PDA_SEED_NODE_KINDS, TYPE_NODE_KINDS, VALUE_NODE_KINDS } from '@codama/nodes';
```

**`ProgramVersion` removed.** Use the `Version` type instead.

```diff
- import type { ProgramVersion } from '@codama/node-types';
+ import type { Version } from '@codama/node-types';
```

**Node path formatters removed.** `nodePathToString` and `nodePathToStringArray` are removed from `@codama/visitors-core`. Use `getNodePathString` from `@codama/errors`, which renders paths the way error messages do, or `NodeStack#toString` for the current path of a stack.

```diff
- import { nodePathToString, nodePathToStringArray } from '@codama/visitors-core';
+ import { getNodePathString } from '@codama/errors';

- nodePathToString(path);
+ getNodePathString(path);
- nodePathToStringArray(path);
+ path.map(node => getNodePathString([node]));
```
