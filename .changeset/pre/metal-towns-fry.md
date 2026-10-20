---
'@codama/errors': minor
---

Render every node path of an error context as node selectors in error messages, not only `path`, as well as lists of node paths, e.g. a `cycle`. `getNodePathString` falls back to the `name` of nodes that have no `identifier`, so v1 nodes render too.
