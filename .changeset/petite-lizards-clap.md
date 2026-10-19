---
'@codama/visitors-core': minor
---

Add helpers to detect cyclic defined types and defined types without any finite value, and fix cycle detection in the byte-size visitors across programs.

- `getDefinedTypeLinksVisitor(linkables, { stack? })` lists the paths of the defined types a node links to, without following these links.
- `getHasFiniteValueVisitor(linkables, { stack? })` tells whether a type has at least one finite value, following links: options, enums and collections without a fixed positive count stop a recursion, whereas a link back to a type being visited (e.g. `loop = struct { next: link(loop) }`) or an enum without variants has none.
- `isDefinedTypeCyclic(path, linkables)` tells whether a defined type links back to itself, directly or through other defined types.
- `hasDefinedTypeFiniteValue(path, linkables)` tells whether a defined type has at least one finite value.

Both helpers resolve links from the program of the given path and throw `CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING` when it has none.

`getByteSizeVisitor` and `getMaxByteSizeVisitor` now track the defined types being visited by node rather than by name, so a link to a same-named type of another program is no longer mistaken for a cycle, and links back to a type being visited still return `null`.
