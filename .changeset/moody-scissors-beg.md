---
'@kinobi-so/renderers': minor
'@kinobi-so/renderers-core': minor
'@kinobi-so/renderers-js-umi': minor
'@kinobi-so/renderers-rust': minor
'@kinobi-so/visitors-core': minor
'@kinobi-so/renderers-js': minor
'@kinobi-so/nodes-from-anchor': minor
'@kinobi-so/node-types': minor
'@kinobi-so/validators': minor
'@kinobi-so/visitors': minor
'@kinobi-so/nodes': minor
---

Remove `importFrom` attributes from link nodes and resolvers

Instead, a new `linkOverrides` attribute is introduced on all renderers to redirect a link node or a resolver to a custom path or module.