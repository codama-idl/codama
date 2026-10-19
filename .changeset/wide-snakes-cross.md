---
'@codama/validators': major
---

Drop the `node` attribute of validation items in favour of their `path`, and keep the `CodamaError` a validation item stems from as its `cause`.

**BREAKING CHANGES**

**`ValidationItem.node` removed.** The node an item is about is now the last node of its `path`, which `ValidationItem<TNode>` can type. Items about identifier collisions and instruction accounts without identifiers now lead to the offending entry rather than its parent.

```diff
- const node = item.node;
+ const node = getLastNodeFromPath(item.path);
```

**`ValidationItem.cause` added.** Items matching a `CodamaError`, whether thrown while validating (e.g. a cyclic dependency between instruction inputs) or the error a codec would throw (e.g. a defined type without a finite value), keep it as their `cause`, so consumers can match its code and context rather than its message.

```ts
const cycles = items.filter(item =>
    isCodamaError(
        item.cause,
        CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
    ),
);
```

**`validationItem` signature changed.** The `node` parameter is removed and an optional `cause` is appended. Passing an empty path, or a `NodeStack` whose path is empty, throws `CODAMA_ERROR__UNEXPECTED_NODE_KIND`, since an item must be about a node.

```diff
- validationItem('warn', 'Program has no version.', program, stack);
+ validationItem('warn', 'Program has no version.', stack);
+ validationItem('error', error.message, stack, error);
```
