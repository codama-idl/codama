---
'@codama/nodes': minor
---

Integrate `@codama/spec@1.8.0`, adding the `pluginNode` to the node meta-model. A `pluginNode` attaches named, plugin-specific data to a node: it carries a `name` that uniquely identifies the plugin and an optional opaque `payload`. The payload is typed by the new `json` type expression, which renders as `unknown` in TypeScript. `instructionNode` gains an optional `plugins` field holding an array of `pluginNode`. All changes are additive and optional.
