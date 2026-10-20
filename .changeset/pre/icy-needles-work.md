---
'@codama/dynamic-codecs': major
---

Rename the value codecs to `getNodeValueCodec` and `getNodeValueCodecVisitor` and rework their value format for Codama v2 IDLs. Codecs now support every v2 data node, reject values of the wrong type when encoding, resolve injected values and handle recursive types.

**BREAKING CHANGES**

**`getNodeCodec` renamed to `getNodeValueCodec`.** The same goes for `getNodeCodecVisitor`, renamed to `getNodeValueCodecVisitor`. The former names now return codecs of `DecodedNode` trees instead, so existing calls still compile but return `{ value, path, … }` objects.

```diff
- const codec = getNodeCodec([root, program, account]);
+ const codec = getNodeValueCodec([root, program, account]);
```

**New value format.** Every integer decodes to a `bigint`, whatever its size. Struct keys and enum `__kind`s are the raw identifiers of the IDL, no longer PascalCased. Enum variant data lives under `data`, rather than being spread or wrapped in `fields`. Standalone `enumVariantTypeNode` codecs use `{ __kind, data }`. Fixed points, date-times and durations decode to their raw integers.

```diff
- { __kind: 'Move', __discriminator: 2, x: 10, y: 20 }
+ { __kind: 'move', __discriminator: 2, data: { x: 10n, y: 20n } }
- { __kind: 'Write', __discriminator: 3, fields: ['hi'] }
+ { __kind: 'write', __discriminator: 3, data: ['hi'] }
```

**Strict encoding.** Values that do not match their type, e.g. a string for an integer, a `Map` for a struct or a missing field without a default value, throw `CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` instead of silently encoding other bytes. Its `path` context is the path of the node that rejected the value, through the definition of linked types. Encoding a set with items that encode to the same bytes throws `CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM` (`{ firstIndex, index, path }`). Decoding still keeps duplicates. A missing option now encodes as `None`.

**Value nodes.** `getValueNodeVisitor` returns values in the same format, e.g. `integerValueNode('42')` returns `42n`, and resolves `injectedValueNode`s from its new `scope` option instead of throwing.

**New features**

- **Nodes:** `integerTypeNode` (honouring big-endian integers, previously ignored), `floatTypeNode`, `fixedPointTypeNode`, `dateTimeTypeNode`, `durationTypeNode`, `sentinelCountNode`, instructions encoding their `data` and the `transforms` of type and link nodes, applied from the innermost to the outermost.
- **Encoding inputs:** bytes also encode from a `Uint8Array`, enum variants without data from their identifier, e.g. `'quit'`, and struct fields fall back to their `defaultValue`, always for `omitted` fields. Defaults are evaluated lazily, so injected ones only throw when needed.
- **Injected values:** the enclosing instructions on the path provide the values of `injectedValueNode`s. Visitors, including `getCodecAndValueVisitors`, accept them via a `scope` option.
- **Recursive types:** defined types linking back to themselves get codecs instead of overflowing the stack. Types with no finite value, e.g. `loop = struct { next: link(loop) }`, throw `CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE` when creating the codec.
- **Options:** `linkables` (new `NodeCodecOptions` type) reuses the linkable nodes of the tree instead of recording them again. `resolvedDefaultValues` supplies the values of struct field defaults resolved beforehand, e.g. those injected from account data.
- **Helpers:** new `getConstantValueBytes` encodes a `constantValueNode` with its own type.
