---
'@codama/validators': patch
---

Fix `getValidationItemsVisitor` throwing `Expected node of kind [definedTypeLinkNode]` on any nested `definedTypeLinkNode` (a struct field, argument, array element, or PDA seed), and recording `ValidationItem` paths that omitted the node itself. The visitor now composes `recordNodeStackVisitor` outermost, like every other visitor, so the current node is on the stack when validation runs.
