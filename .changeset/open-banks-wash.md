---
'@codama/upgrade': major
---

Initial release of `@codama/upgrade`. It upgrades Codama IDLs of any supported major version to the latest major of the standard via `upgrade(rootNode)`, `upgradeFromJson(json)`, and the `upgradeToLatestVisitor()` preprocessing visitor (also the package's default export, so `"@codama/upgrade"` alone works as a CLI `before` visitor). The frozen v1 node types are exposed under the type-only `v1` namespace. While the latest spec major is 1, upgrading a 1.x document is an identity transform plus a restamp to the latest spec version.
