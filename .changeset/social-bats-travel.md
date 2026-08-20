---
'@codama/node-types': patch
'@codama/nodes': patch
---

Widen the `CodamaVersion` type from the exact pinned literal (`'1.9.1'`) to a major-pinned template literal (`1.${number}.${number}`), so any document of the current spec major type-checks as a `RootNode` rather than only documents carrying the exact pinned version. Add a `getCodamaVersionMajor(version)` helper to `@codama/nodes` that defensively extracts the major from an arbitrary version string, returning `null` when it cannot be parsed.
