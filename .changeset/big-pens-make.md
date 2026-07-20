---
'@codama/node-types': minor
'@codama/nodes': minor
---

Omit empty array attributes from nodes, and default absent arrays to `[]` on read.

Every node array attribute — whether previously required (e.g. `programNode.accounts`, `instructionNode.arguments`, `structTypeNode.fields`) or optional (e.g. `instructionNode.discriminators`) — is now omitted from the node when empty, and defaults to `[]` when absent. An absent array and an empty array are semantically identical, so this keeps encoded IDLs small (they are often uploaded on-chain) and makes adding or omitting an array attribute non-breaking. Reading remains backwards-compatible: IDLs that still serialise empty arrays continue to parse, and every visitor and accessor normalises an absent array to `[]`.

**Breaking type change.** While runtime reads stay backwards-compatible, this is a breaking change at the type level for external consumers such as renderers and community packages. Array attributes are now typed as optional on the node interfaces (e.g. `ProgramNode.accounts` is now `readonly accounts?: AccountNode[]`), so any code that reads an array attribute without guarding — e.g. `program.accounts.map(…)` — must now coalesce with `?? []` (`(program.accounts ?? []).map(…)`). Type-parameter constraints also widen from `Array<T>` to `Array<T> | undefined`, so indexing into these types (e.g. `InstructionNode['arguments'][number]`) must be rewritten as `NonNullable<InstructionNode['arguments']>[number]`. Consumers should expect compile errors on the first unguarded array read after upgrading and add `?? []` guards accordingly.
