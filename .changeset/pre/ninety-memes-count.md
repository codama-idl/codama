---
'@codama/cli': major
'@codama/dynamic-address-resolution': major
'@codama/dynamic-client': major
'@codama/dynamic-codecs': major
'@codama/dynamic-instructions': major
'@codama/dynamic-parsers': major
'@codama/errors': major
'@codama/fragments': major
'codama': major
'@codama/node-types': major
'@codama/nodes': major
'@codama/nodes-from-anchor': major
'@codama/renderers-core': major
'@codama/upgrade': major
'@codama/validators': major
'@codama/visitors': major
'@codama/visitors-core': major
---

Require Node.js 22.12.0 or later.

**BREAKING CHANGES**

**Node.js 20 is no longer supported.** Every package now declares `"engines": { "node": ">=22.12.0" }`, the first Node.js 22 release that supports `require(esm)` by default. Node.js 20 reached its end of life in April 2026, and some dependencies (e.g. `commander`) already require Node.js 22.12.0.
