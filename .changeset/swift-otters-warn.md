---
'codama': patch
---

Reject malformed root structures at the JSON boundary. `createFromRoot` now asserts that the given root is a `rootNode`, validates its document version, and asserts that its child is a `programNode`. `update()` likewise asserts that the visited root's output preserves the `programNode` child. Malformed IDLs that previously slipped through `createFromJson` and crashed later with a raw `TypeError` now fail at the boundary with a `CODAMA_ERROR__UNEXPECTED_NODE_KIND` error.
