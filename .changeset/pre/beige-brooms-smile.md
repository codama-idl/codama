---
'@codama/visitors-core': minor
---

Add `NodeStack` helpers to jump to other parts of the tree, pass the visitor itself to interceptors, and add helpers to record and list linkable nodes.

- `stack.withPath(path, callback)` runs `callback` with `path` as the current path, then restores the previous one, even if `callback` throws.
- `stack.visitPath(path, visitor)` visits the last node of `path` with the rest of `path` as the current path, e.g. to visit the definition of a linked node: `stack.visitPath(linkables.getPathOrThrow(linkPath), self)`.
- `VisitorInterceptor` callbacks, used by `interceptVisitor` and `interceptFirstVisitVisitor`, receive the intercepted visitor as a third `self` argument, so they can visit other nodes with the whole visitor.
- `getLinkablesFromNode(node)` records the linkable nodes under a node into a new `LinkableDictionary`, replacing `new LinkableDictionary()` followed by `visit(node, getRecordLinkablesVisitor(linkables))`.
- `linkables.getRecordedPathsOfKind(kind)` lists the paths of every recorded linkable node of a kind, across all programs, e.g. `getRecordedPathsOfKind('accountNode')`.

Also fix two `NodeStack` issues: `recordNodeStackVisitor` now restores the stack when a visit throws, and visitors following links (`getByteSizeVisitor`, `getMaxByteSizeVisitor`) no longer put the linked node twice on the path.
