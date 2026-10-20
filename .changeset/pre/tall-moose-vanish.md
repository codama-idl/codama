---
'@codama/node-types': major
'@codama/nodes': major
---

Remove the casing helpers and casing brands in favour of `@codama/fragments/casing`, drop the helpers of removed v1 nodes, and add helpers for interpolated intents, text nodes, transforms and the spec's branded strings.

New in `@codama/nodes`:

- `parseInterpolatedIntent(template)` splits an intent into literal text and the contextual value nodes its placeholders stand for (`${data.config.fees[0]}` → `dataValueNode`, `${accounts.mint}` → `accountValueNode`, `${accounts.mint.data.decimals}` → `accountDataValueNode`), throwing `CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER` on malformed placeholders. `printInterpolatedIntent(parts)` is its inverse, and `InterpolatedIntentPart` the type of the parts.
- `getTextNodeContent(value)` reads the plain text of any `string | TextNode` attribute, e.g. `docs`, labels or `instructionStatusNode.message`.
- `addTypeNodeTransforms(typeNode, transforms)` appends transforms after those a type node already carries, e.g. to carry the transforms of a replaced type node across.
- `identifierString`, `namespaceString`, `pathString`, `integerString` and `decimalString` validate a string against the spec's grammar and return it branded as `IdentifierString`, `NamespaceString`, `PathString`, `IntegerString` or `DecimalString` (new in `@codama/node-types`), throwing `CODAMA_ERROR__INVALID_BRANDED_STRING` otherwise.

**BREAKING CHANGES**

**Casing helpers moved to `@codama/fragments/casing`.** `capitalize`, `titleCase`, `pascalCase`, `camelCase`, `kebabCase` and `snakeCase` are removed from `@codama/nodes`. Their replacements return a plain `string` and split words as the spec does (see the `@codama/fragments` changelog).

```diff
- import { camelCase } from '@codama/nodes';
+ import { camelCase } from '@codama/fragments/casing';
```

**Casing brands removed.** `CamelCaseString`, `PascalCaseString`, `KebabCaseString`, `SnakeCaseString` and `TitleCaseString` are removed from `@codama/node-types` (and their re-exports from `@codama/nodes`), since identifiers no longer mandate a casing. Use `IdentifierString` for node identifiers, or a plain `string` for derived names.

**Helpers of removed nodes dropped.** The following `@codama/nodes` helpers are removed along with the nodes they served:

- `resolveNestedTypeNode`, `transformNestedTypeNode`, `isNestedTypeNode` and `assertIsNestedTypeNode`, since wrapper type nodes are replaced by `transforms`. Read or append `typeNode.transforms` instead, e.g. with `addTypeNodeTransforms`.
- `isSignedInteger`, `isUnsignedInteger`, `isInteger` and `isDecimal`, since `numberTypeNode` is split into `integerTypeNode` and `floatTypeNode`. Check the node kind or `format` instead.
- `getAllInstructionArguments`, `structTypeNodeFromInstructionArgumentNodes` and `structFieldTypeNodeFromInstructionArgumentNode`, since instruction arguments now live in `instructionNode.data`.
- The `ENUM_VARIANT_TYPE_NODES` alias, since the three enum variant nodes are now a single `enumVariantTypeNode`.

**`Docs`, `DocsInput` and `parseDocs` removed.** `docs` attributes are now a single `string | TextNode` rather than an array of paragraphs, so the `Docs` type of `@codama/node-types` and the `DocsInput` type and `parseDocs` helper of `@codama/nodes` are removed. Constructors store `docs` as given; join paragraphs into one Markdown string instead.

```diff
- definedTypeNode({ name: 'counter', type, docs: ['A counter.', 'Second paragraph.'] });
+ definedTypeNode({ identifier: 'counter', type, docs: 'A counter.\n\nSecond paragraph.' });
```
