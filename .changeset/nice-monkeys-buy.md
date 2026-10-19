---
'@codama/visitors-core': major
---

Clear the `LinkableDictionary` before each top-level visit of `recordLinkablesOnFirstVisitVisitor`, so a reused visitor no longer resolves links against previously visited trees. Also add a `LinkableDictionary.clear()` method.

**BREAKING CHANGES**

**`recordLinkablesOnFirstVisitVisitor` clears its dictionary.** `recordLinkablesOnFirstVisitVisitor` clears the dictionary before each top-level visit, so linkables recorded into it beforehand are discarded; record extra linkables inside the visitor instead.
