---
'@codama/node-types': patch
---

Bump `@codama/spec` from `1.6.0-rc.4` to `1.6.0-rc.6`. The encoded surface in `@codama/node-types` is functionally unchanged; one docstring paragraph on `NestedTypeNode` now reads `nestedTypeNode<T>` instead of `NestedTypeNode<T>` to mirror the spec's new camelCase nested-union alias name.

Behind the scenes, `@codama-internal/spec-generators` learns about the new `{ kind: 'address' }` `TypeExpr` (rendered as plain `string` on the v1 TS surface — a dedicated `Address` brand may follow in a future spec major), the camelCase rename of every union and enumeration name on the spec side (the generated PascalCase TS identifiers are unaffected since the generator runs each name through `pascalCase()` at render time), and a constructor-signature bug where an attribute that was both `optional` and supplied with a default would emit invalid TS (`param?: T = default`). The bug never triggered against the rc.4 v1 spec but would have surfaced once any future attribute combined `optional: true` with a configured default; the fix is to omit the `?` mark whenever an initializer is present.
