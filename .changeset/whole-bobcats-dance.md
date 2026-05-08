---
'@codama/renderers-core': patch
---

Re-export the language-agnostic fragment primitives, path helpers, filesystem helpers, and `RenderMap` data operations from `@codama/fragments`. The implementations have moved to that package so they can be shared with code generators and other consumers outside the renderers stack; existing importers of `@codama/renderers-core` continue to see every public name at the same import path with no behaviour change. `writeRenderMapVisitor` stays in `renderers-core` since it depends on the visitor + node infrastructure that `@codama/fragments` deliberately does not pull in.
