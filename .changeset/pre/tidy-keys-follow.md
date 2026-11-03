---
'@codama/node-types': patch
'@codama/nodes': patch
---

Emit node attributes in the declaration order of the spec, followed by base attributes, instead of regrouping them into data and child attributes. Encoded IDLs change order only, e.g. the `docs` of a `pdaNode` now come before its `programId`, and readers must not depend on attribute order. Following `@codama/spec@2.0.0-rc.4`, link nodes now put their `identifier` before their parent link, and the type parameters of `ValueLabelDisplayNode` follow its new attribute order (`TLabel` before `TValue`).

```jsonc
// Before
{ "kind": "pdaNode", "identifier": "vault", "programId": "…", "docs": "The vault.", "seeds": […] }

// After
{ "kind": "pdaNode", "identifier": "vault", "docs": "The vault.", "programId": "…", "seeds": […] }
```
