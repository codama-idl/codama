---
'@codama/nodes': minor
'@codama/dynamic-codecs': patch
---

Integrate `@codama/spec@1.7.0`, adding the presentation layer to the node meta-model. This introduces display nodes (`amountNumberDisplayNode`, `dateTimeNumberDisplayNode`, `durationNumberDisplayNode`, `stringDisplayNode`, `instructionDisplayNode`, `instructionAccountDisplayNode`, `structFieldDisplayNode`, `enumVariantDisplayNode`), the provide/inject graph (`providedNode`, `injectedValueNode`), the `accountFieldValueNode` contextual value backed by `instructionAccountNode.accountLink`, and the `anyNode` type expression. Existing nodes gain optional `display`/`provides` fields. All changes are additive and optional.
