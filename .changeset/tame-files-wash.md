---
"@kinobi-so/renderers-js-umi": minor
"@kinobi-so/renderers-rust": minor
"@kinobi-so/visitors-core": minor
"@kinobi-so/renderers-js": minor
"@kinobi-so/node-types": minor
"@kinobi-so/errors": minor
"@kinobi-so/nodes": minor
---

Add `RemainderOptionTypeNode`

A node that represents an optional item using a child `TypeNode` such that the item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer.
