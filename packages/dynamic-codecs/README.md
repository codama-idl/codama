# Codama ➤ Dynamic Codecs

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/dynamic-codecs.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/dynamic-codecs.svg?style=flat&label=%40codama%2Fdynamic-codecs
[npm-url]: https://www.npmjs.com/package/@codama/dynamic-codecs

This package creates [`@solana/codecs`](https://github.com/anza-xyz/kit/tree/main/packages/codecs) on demand for any Codama node that describes data, so you can encode and decode accounts, instructions, events and types straight from a Codama IDL.

## Installation

```sh
pnpm install @codama/dynamic-codecs
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Usage

Give `getNodeValueCodec` the path to a node, starting from the root node, and it returns a `Codec<unknown>` for that node.

```ts
import { getNodeValueCodec } from '@codama/dynamic-codecs';

const codec = getNodeValueCodec([root, program, counterAccount]);
const bytes = codec.encode({ authority: '9BbWp6tcX9MEGSUEpNXfspYxYsWCxE9FgRkAc3RpftkT', count: 42 });
const counter = codec.decode(bytes);
// ^ { authority: '9BbWp6tcX9MEGSUEpNXfspYxYsWCxE9FgRkAc3RpftkT', count: 42n }
```

## Decoded nodes

`getNodeCodec` returns a codec that decodes into a `DecodedNode` rather than a plain value. A decoded node keeps the `path` of the node that decoded it, from the root, its `value` in the format of `getNodeValueCodec`, the absolute cursor positions before and after reading it (`preOffset` and `postOffset`, transforms included, in the vocabulary of Kit's offset codecs) and the decoded nodes of its children, named after the attributes of their node, e.g. the `fields` of a struct. It encodes from `{ value }`.

```ts
import { assertIsDecodedNode, getNodeCodec } from '@codama/dynamic-codecs';

// counter = struct { authority: publicKey, count: u64 }
const decoded = getNodeCodec([root, program, counterAccount]).decode(bytes);
decoded.value; // { authority: '9BbW…ftkT', count: 42n }
assertIsDecodedNode(decoded.data, 'structTypeNode');
decoded.data.fields[1].type; // { path: [root, program, counterAccount, struct, countField, u64], value: 42n, preOffset: 32, postOffset: 40 }
```

| Node                                                                  | Children                           |
| --------------------------------------------------------------------- | ---------------------------------- |
| `AccountNode`, `EventNode`                                            | `data`                             |
| `InstructionNode`                                                     | `data` (absent without data)       |
| `DefinedTypeNode`, `StructFieldTypeNode`                              | `type`                             |
| `StructTypeNode`                                                      | `fields`                           |
| `EnumTypeNode`                                                        | `variant`, the decoded variant     |
| `EnumVariantTypeNode`                                                 | `data` (absent without data)       |
| `OptionTypeNode`, `RemainderOptionTypeNode`, `ZeroableOptionTypeNode` | `item` (absent when `None`)        |
| `ArrayTypeNode`, `SetTypeNode`, `TupleTypeNode`                       | `items`                            |
| `MapTypeNode`                                                         | `entries`, as `[key, value]` pairs |

Other type nodes, such as integers, fixed points or strings, have no children: their node, available via `getLastNodeFromPath(decoded.path)`, tells how to read their value.

Links are transparent: they decode as the node they link to, so the path of a linked type goes through its definition, e.g. `[root, program, definedType, enumTypeNode]`. The transforms of a link, e.g. a size prefix, are included in the cursor positions of the type it decodes as, although that type's own node does not carry them. Recursive types decode at any depth.

Each node kind has its own decoded node type, e.g. `DecodedStructTypeNode` or `DecodedIntegerTypeNode`, and `DecodedNode<TNode>` gives the one of a node type. Use `isDecodedNode` or `assertIsDecodedNode` to narrow a decoded node to a node kind, e.g. to access its children.

```ts
const amount = decoded.data; // DecodedTypeNode
if (isDecodedNode(amount, 'structTypeNode')) {
    amount.fields; // DecodedStructFieldTypeNode[]
}
```

## Formatting

Decoded nodes carry the nodes that decoded them, so their values can be formatted for humans using the presentation metadata of those nodes: units, display nodes, scales and ticks. Each formatter takes the decoded node of its kind.

| Formatter          | Decoded node                | Example                         |
| ------------------ | --------------------------- | ------------------------------- |
| `formatInteger`    | `DecodedIntegerTypeNode`    | `"1.5 USDC"`, `"42 slots"`      |
| `formatFloat`      | `DecodedFloatTypeNode`      | `"1.5 USD"`                     |
| `formatFixedPoint` | `DecodedFixedPointTypeNode` | `"123.45%"`                     |
| `formatDateTime`   | `DecodedDateTimeTypeNode`   | `"2024-01-01T00:00:00.5Z"`      |
| `formatDuration`   | `DecodedDurationTypeNode`   | `"49:00:00"`, `"-00:00:01.5"`   |
| `formatString`     | `DecodedStringTypeNode`     | `"abcd"`, sliced by its display |
| `formatBoolean`    | `DecodedBooleanTypeNode`    | `"true"`                        |
| `formatBytes`      | `DecodedBytesTypeNode`      | `"0x0102"`                      |
| `formatEnum`       | `DecodedEnumTypeNode`       | `"Move"`, `"Move To"`           |
| `formatPublicKey`  | `DecodedPublicKeyTypeNode`  | `"USDC"`, or its address        |

```ts
import { formatInteger, getNodeCodec, isDecodedNode } from '@codama/dynamic-codecs';

// amount: u64 with amountNumberDisplayNode({ decimals: integerValueNode('6'), unit: stringValueNode('USDC') })
const decoded = getNodeCodec([root, program, amountType]).decode(bytes);
if (isDecodedNode(decoded.type, 'integerTypeNode')) {
    formatInteger(decoded.type); // "1.5 USDC"
}
```

Numbers are formatted exactly, including 128-bit integers and binary fixed points, using the fixed points of `@solana/codecs`. String slices count Unicode code points, so they never split a character such as an emoji. Date-times are exact ISO 8601 UTC strings for any year.

- **Units:** the unit of a display node wins over the unit of a type, which is the fallback whenever the former is absent or cannot be resolved. Units follow their value after a space, except `%`, `‰` and `°`. Address units, literal or injected, are formatted by the `formatAddress` option, or written as the address otherwise.
- **Amounts:** when the `decimals` of an `amountNumberDisplayNode` cannot be resolved, `formatInteger` returns `null` rather than a wrongly scaled amount, so you can present the raw value instead.
- **Injected values:** decimals and units injected from the enclosing instructions resolve on their own when those instructions provide them as value nodes, or from their fallbacks. Other providers, e.g. an account or its data, need the instruction itself, through the `resolveInjectedValue` option.
- **Ticks:** `formatDateTime` and `formatDuration` throw `CODAMA_ERROR__INVALID_TICKS_PER_SECOND` when `ticksPerSecond` is not a positive integer.
- **Bytes:** bytes are written in hexadecimal whatever the encoding they were decoded with. Bytes decoded as `utf8` cannot be recovered exactly when they are not valid UTF-8, so decode them with another encoding.
- **Enums:** the label of the variant's display node, or the variant's identifier in title case otherwise. The data of the variant is not included.
- **Public keys:** formatted by the `formatAddress` option, e.g. to name or truncate them, or written as the address otherwise.

All formatters share the `(decoded, options)` signature and accept the following options, though each only uses those relevant to it, e.g. `formatAddress` for public keys and `numberFormat` for numbers:

| Name                   | Type                                                                                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `formatUnit`           | `(value: string, unit: string) => string`                                                        | Place a unit next to a value, e.g. `` (value, unit) => `${unit} ${value}` `` for `"USD 40.5"`. Defaults to `formatUnit`, also exported.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `formatAddress`        | `(address: Address) => string`                                                                   | Format an address, e.g. to name it from sources you trust such as a token list or an address book, or to truncate it: `address => names.get(address) ?? address`. Used for public keys and address units, literal or injected. Defaults to the address itself.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `numberFormat`         | `Intl.NumberFormat`                                                                              | Format numbers for a locale, e.g. `"1,234,567.89"`. Its options decide the digits shown. Amounts and fixed points are given to it exactly, never through a JavaScript float.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `resolveInjectedValue` | `(path: NodePath<InjectedValueNode>, parents: readonly DecodedNode[]) => ValueNode \| undefined` | Resolve injected values of display nodes, e.g. `decimals` provided by an instruction, to the value node they stand for, e.g. `integerValueNode('6')`, or `publicKeyValueNode(mint)` for a unit provided by an account. It receives the path of the injection through the decoded node and, from `formatDecodedNode`, the decoded nodes containing the value, e.g. `[data, config]`, which tell apart values whose types link to the same defined type. Resolved values are used as literal ones. A value node of the wrong kind means unresolved. When absent or returning `undefined`, injections resolve from the value nodes provided in `scope`, and from their fallbacks. |
| `scope`                | `ProvidedScope`                                                                                  | The `provides` in scope of the formatted values. `formatDecodedNode` defaults it to the instructions on the path of the node it formats, so values within linked defined types see them too.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Formatted nodes

`formatDecodedNode` formats a decoded node of any kind, e.g. a whole account, into a formatted node: the same tree, where every node also carries its `text` and whether it is `degraded`. Formatted nodes are decoded nodes too, so they keep their `path`, `value` and offsets and work wherever decoded nodes do.

```ts
import { assertIsFormattedNode, formatDecodedNode } from '@codama/dynamic-codecs';

// account: a decoded account, e.g. from `parseAccountData` of `@codama/dynamic-parsers`
const formatted = formatDecodedNode(account, {
    formatAddress: address => names.get(address) ?? address,
});
formatted.text; // "Amount: 1.5 USDC, Owner: Alice, Config: (Fee: 25 bps)"

assertIsFormattedNode(formatted.data, 'structTypeNode');
for (const field of formatted.data.fields) {
    field.label; // "Amount"
    field.text; // "1.5 USDC"
    field.type; // the formatted type, e.g. a struct to lay out as nested rows
}
```

- **Leaves** use the formatter of their kind. On top of the [formatting options](#formatting), you can override the formatters of booleans, bytes, date-times, durations, enum labels, fixed points, floats, integers and strings, e.g. `formatBoolean: boolean => (boolean.value ? 'Yes' : 'No')`. Public keys go through `formatAddress`.
- **Struct fields** carry their `label`, `skip`, `flatten` and `flattenPrefix`, from their display node or their defaults: the identifier in title case, `"never"`, `false` and `""`. `flatten` is only `true` when the field's type is a struct.
- **Value labels:** a struct field whose decoded value matches one of its value labels presents that label, as its `text` and its `valueLabel`, wherever it is, e.g. within a nested struct, and is not flattened. Labels are matched as `getValueLabel` does, following links with the `linkables` option, recorded from the root of the decoded node when absent.
- **Enum variants** carry their `label` and `skipInnerData`.
- **Text** joins the text of children: `Label: text` for struct fields, `, ` between items and map entries, `None` for empty options, and the variant's label followed by its data in parentheses for enums, e.g. `Limit (Price: 100)`. Containers within containers are wrapped in parentheses, so an empty one shows as `()`, e.g. `Items: ()`. Struct fields skipped `always` are left out, and flattened fields are replaced by their own fields, with their prefix.
- **Degraded** nodes are amounts whose `decimals` cannot be resolved, written as their raw value, and every node whose text includes them. The `formatDegraded` option presents the raw value, e.g. `` raw => `${raw} (raw)` ``, so it cannot be mistaken for a formatted one.

`getFormattedRows` lays out a formatted struct as rows, as its text does: fields skipped `always` are left out and flattened fields are replaced by their own rows, with their prefix. Fields skipped `whenInjected` are kept, with their `skip`, since only you know whether another row presents their value. Each row carries the `identifiers` of the fields leading to it, e.g. `['config', 'fee']`, to key it.

```ts
assertIsFormattedNode(formatted.data, 'structTypeNode');
getFormattedRows(formatted.data); // [{ identifiers: ['amount'], label: 'Amount', text: '1.5 USDC', field }, …]
```

To fill a sentence such as an instruction's interpolated intent, `getDecodedNodeAtPath` finds the node a path expression points to, e.g. `getDecodedNodeAtPath(formatted, pathString('config.fees[0]'))?.text`. It returns `undefined` for indices beyond the items of an array or set, and throws `CODAMA_ERROR__CANNOT_RESOLVE_PATH` for paths that do not fit the data, e.g. an unknown field. As with `resolveTypePath`, paths do not go through options or enums.

Paths may cross the `accountLink` of a public key into the data of the linked account with a `.data` segment, e.g. `mint.data.decimals`, and `mint.data` returns that whole data. Other segments after a linked public key are reserved for other attributes of the account, so they throw. Give the decoded accounts, e.g. fetched beforehand, through the `resolveAccountLink` option. It returns `undefined` for accounts it does not have, which makes the whole path `undefined`, so the display can fall back.

```ts
getDecodedNodeAtPath(formatted, pathString('mint.data.decimals'), {
    resolveAccountLink: publicKey => formattedAccounts.get(publicKey.value),
})?.text; // "6"
```

### Value labels

`getValueLabel` returns the label a decoded struct field presents instead of its value, as formatted nodes do, from the `valueLabels` of its display node, e.g. `"All"` for an amount of `u64::MAX`. Labels apply to the raw value, before any formatting, so present the label instead of the formatted text when there is one. A label matches when its value encodes to the same bytes as the decoded value, so equal values match whatever their representation, and the first matching label wins. Links of the field's type are followed using the linkable nodes of the tree, recorded from the root of its path unless given as the `linkables` option. Values injected into its type resolve from the `scope` option, or from the instructions on its path otherwise. Labels must be values of the field's type, as validators require, and others throw.

```ts
getValueLabel(amountField); // "All"
```

## Node paths

The full path is needed to resolve link nodes, which may point to other programs, and injected values, which are provided by the enclosing instructions.

```ts
const root = rootNode(
    programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'slot', type: integerTypeNode('u64') }),
            definedTypeNode({ identifier: 'lastSlot', type: definedTypeLinkNode('slot') }),
        ],
        identifier: 'myProgram',
        publicKey: '1111',
    }),
);

// The `lastSlot` codec is resolved using the linked `slot` type.
const codec = getNodeValueCodec([root, root.program, root.program.definedTypes[1]]);
codec.encode(42); // 0x2a00000000000000
codec.decode(hex('2a00000000000000')); // 42n
```

The following nodes can be at the end of the path: `AccountNode`, `AccountLinkNode`, `DefinedTypeNode`, `DefinedTypeLinkNode`, `EventNode`, `InstructionNode`, `InstructionLinkNode`, `StructFieldTypeNode`, `EnumVariantTypeNode` and any type node.

## Options

| Name                    | Type                                        | Default                            | Description                                                                                                                                             |
| ----------------------- | ------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bytesEncoding`         | `BytesEncoding`                             | `"base64"`                         | The encoding used when decoding plain bytes.                                                                                                            |
| `resolvedDefaultValues` | `ReadonlyMap<StructFieldTypeNode, unknown>` | None                               | Values used when encoding the default values of these fields, instead of evaluating them.                                                               |
| `linkables`             | `LinkableDictionary`                        | Recorded from the root of the path | The linkable nodes of the tree, e.g. from `getLinkablesFromNode(root)`, to avoid recording them again. Only for `getNodeCodec` and `getNodeValueCodec`. |

```ts
const codec = getNodeValueCodec([root, program, definedType], { bytesEncoding: 'base16' });
```

Codecs evaluate default values synchronously, so they cannot evaluate those injected from account data, which must be fetched first. Resolve them beforehand, e.g. with `resolveInstructionDataDefaultValues` from [`@codama/dynamic-address-resolution`](../dynamic-address-resolution/README.md#reading-account-data), and pass them as `resolvedDefaultValues`.

## Value format

Values are raw JavaScript values that stay close to the bytes. For instance, a fixed point decodes to its raw integer, not to a decimal number. Types such as `Uint8Array`, `Set` or `Map` are avoided in decoded values to keep them JSON compatible, with the exception of `bigint`. When encoding, a few more inputs are accepted for convenience, as described in the notes below.

| Node                                                                                                                | Example                                                      | Notes                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| [`IntegerTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/IntegerTypeNode.md)                 | `42n`                                                        | Always decodes to a `bigint`, whatever its size. Encodes from an integer `number` or a `bigint`.                         |
| [`FloatTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/FloatTypeNode.md)                     | `1.5`                                                        |                                                                                                                          |
| [`FixedPointTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/FixedPointTypeNode.md)           | `150n`                                                       | The raw integer, e.g. `1.5` with a scale of `2`.                                                                         |
| [`DateTimeTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/DateTimeTypeNode.md)               | `1700000000n`                                                | The raw integer, in ticks.                                                                                               |
| [`DurationTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/DurationTypeNode.md)               | `1500n`                                                      | The raw integer, in ticks.                                                                                               |
| [`BooleanTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/BooleanTypeNode.md)                 | `true`                                                       |                                                                                                                          |
| [`StringTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/StringTypeNode.md)                   | `"Hello World"`                                              | Uses the encoding of the node.                                                                                           |
| [`BytesTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/BytesTypeNode.md)                     | `["base64", "SGVsbG8="]`                                     | Also encodes from a `Uint8Array`. Decodes using the `bytesEncoding` option.                                              |
| [`PublicKeyTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/PublicKeyTypeNode.md)             | `"9BbWp6tcX9MEGSUEpNXfspYxYsWCxE9FgRkAc3RpftkT"`             | A base58 string.                                                                                                         |
| [`StructTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/StructTypeNode.md)                   | `{ first_name: "John", age: 42n }`                           | Keys are the raw field identifiers. See [Default values](#default-values).                                               |
| [`TupleTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/TupleTypeNode.md)                     | `["John", 42n]`                                              |                                                                                                                          |
| [`EnumTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/EnumTypeNode.md)                       | `{ __kind: "move", __discriminator: 2, data: { x: 1n } }`    | See [Enums](#enums). Variants without data also encode from their identifier.                                            |
| [`ArrayTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/ArrayTypeNode.md)                     | `[1n, 2n, 3n]`                                               |                                                                                                                          |
| [`SetTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/SetTypeNode.md)                         | `[1n, 2n, 3n]`                                               | Same as arrays. Encoding rejects duplicate items, see [Invalid values](#invalid-values).                                 |
| [`MapTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/MapTypeNode.md)                         | `{ key1: "value1", key2: "value2" }`                         | An object, whose keys are strings whatever the key type. See [Maps](#maps).                                              |
| [`OptionTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/OptionTypeNode.md)                   | `{ __option: "Some", value: 42n }` or `{ __option: "None" }` | Option objects, rather than `T \| null`, keep nested options distinct. Also encodes from a value, `null` or `undefined`. |
| [`RemainderOptionTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/RemainderOptionTypeNode.md) | `{ __option: "Some", value: 42n }` or `{ __option: "None" }` | Same as options.                                                                                                         |
| [`ZeroableOptionTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/ZeroableOptionTypeNode.md)   | `{ __option: "Some", value: 42n }` or `{ __option: "None" }` | Same as options.                                                                                                         |
| [`StructFieldTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/StructFieldTypeNode.md)         | -                                                            | Same as `node.type`.                                                                                                     |
| [`EnumVariantTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/EnumVariantTypeNode.md)         | -                                                            | `{ __kind, data }`, prefixed by the enum discriminator when the path includes the enum.                                  |
| [`DefinedTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/DefinedTypeNode.md)                           | -                                                            | Same as `node.type`.                                                                                                     |
| [`AccountNode`](https://github.com/codama-idl/spec/blob/main/docs/AccountNode.md)                                   | -                                                            | Same as `node.data`.                                                                                                     |
| [`EventNode`](https://github.com/codama-idl/spec/blob/main/docs/EventNode.md)                                       | -                                                            | Same as `node.data`.                                                                                                     |
| [`InstructionNode`](https://github.com/codama-idl/spec/blob/main/docs/InstructionNode.md)                           | -                                                            | Same as `node.data`. Instructions without data encode to empty bytes.                                                    |
| [`DefinedTypeLinkNode`](https://github.com/codama-idl/spec/blob/main/docs/linkNodes/DefinedTypeLinkNode.md)         | -                                                            | Same as the linked type, with the transforms of the link on top.                                                         |
| [`AccountLinkNode`](https://github.com/codama-idl/spec/blob/main/docs/linkNodes/AccountLinkNode.md)                 | -                                                            | Same as the linked account.                                                                                              |
| [`InstructionLinkNode`](https://github.com/codama-idl/spec/blob/main/docs/linkNodes/InstructionLinkNode.md)         | -                                                            | Same as the linked instruction.                                                                                          |

### Enums

Every enum decodes to an object with the raw variant identifier as `__kind` and the variant discriminator as `__discriminator`. Variants with data carry it under `data`, whatever its type. When encoding, only `__kind` and `data` are read, and variants without data may also be encoded from their identifier alone. Identifiers must match exactly, and variants with data must provide it.

```ts
const codec = getNodeValueCodec([
    enumTypeNode([
        enumVariantTypeNode('quit'),
        enumVariantTypeNode('amount', { data: integerTypeNode('u32') }),
        enumVariantTypeNode('move', {
            data: structTypeNode([structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u8') })]),
        }),
    ]),
]);

codec.decode(hex('00')); // { __kind: 'quit', __discriminator: 0 }
codec.decode(hex('012a000000')); // { __kind: 'amount', __discriminator: 1, data: 42n }
codec.decode(hex('020a')); // { __kind: 'move', __discriminator: 2, data: { x: 10n } }

codec.encode('quit'); // 0x00, same as { __kind: 'quit' }
```

### Maps

Maps decode to plain objects, so their keys are strings. Keys that decode to strings, such as strings and public keys, are used as they are. Other scalars use their string form, e.g. `"42"` for an integer or `"true"` for a boolean, and variants without data use their identifier, e.g. `"quit"`. Other keys, e.g. structs or tuples, use a deterministic JSON form that keeps the order of their fields and writes integers with all their digits, e.g. `'{"x":1,"y":2}'`. When encoding, keys are parsed back using the key type, so decoded maps encode to the same bytes. The decoded node of a map keeps the decoded values of its keys in its `entries`.

```ts
const codec = getNodeValueCodec([
    mapTypeNode(integerTypeNode('u64'), stringTypeNode('utf8'), prefixedCountNode(integerTypeNode('u32'))),
]);
codec.decode(bytes); // { "42": "Alice" }
codec.encode({ 42: 'Alice' }); // same as { "42": "Alice" }
```

### Default values

Struct fields with a `defaultValue` do not need to be provided when encoding. Fields whose `defaultValueStrategy` is `omitted`, such as discriminators, always encode their default value, even if a value is provided. Other fields encode their default value when missing from the input.

```ts
const codec = getNodeValueCodec([
    structTypeNode([
        structFieldTypeNode({
            defaultValue: integerValueNode('3'),
            defaultValueStrategy: 'omitted',
            identifier: 'discriminator',
            type: integerTypeNode('u8'),
        }),
        structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u16') }),
        structFieldTypeNode({ defaultValue: integerValueNode('5'), identifier: 'fee', type: integerTypeNode('u8') }),
    ]),
]);

codec.encode({ amount: 42 }); // 0x032a0005
codec.encode({ amount: 42, fee: 9 }); // 0x032a0009
```

Default values are only evaluated when needed. For instance, an `injectedValueNode` default only throws when it is not provided and the field is missing from the input.

A missing struct encodes as a struct whose fields are all missing, so their default values apply, and a missing option encodes as `None`.

### Invalid values

Encoding throws a `CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` error when a value does not match its type, e.g. a string for an integer, an integer out of the range of its format, a map key that does not parse as its key type or a missing field without a default value, rather than encoding unexpected bytes. Structs and maps must be plain objects, so `Map`s or class instances are rejected. Its `path` context is the path of the node that rejected the value, from the root.

Sets also throw a `CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM` error when two items encode to the same bytes, e.g. `[42, 42n]`. Its context gives the `index` of the duplicate, the `firstIndex` of the item it equals and the `path` of the set. Decoding keeps duplicates, so existing data reads as it is.

```ts
const codec = getNodeValueCodec([root, program, instruction]);
codec.encode({ amount: 'x' });
// throws with { path: [root, program, instruction, data, amountField, amountType], … }
```

Linked types report the path of their definition, e.g. `[root, program, definedType, …]`, rather than the path of the link.

### Transforms

The `transforms` of a type node are applied in order, from the innermost to the outermost. Here, the size prefix wraps the fixed-size string.

```ts
const codec = getNodeValueCodec([
    stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(4), sizePrefixTransformNode(integerTypeNode('u8'))] }),
]);

codec.encode('Hi'); // 0x0448690000
```

### Collections

Arrays, sets and maps support every count node. With a `sentinelCountNode`, items are read until the sentinel is found at an item boundary, and its `strategy` controls whether the sentinel is written and required.

```ts
const sentinel = constantValueNodeFromBytes('base16', 'ffff');
const codec = getNodeValueCodec([arrayTypeNode(integerTypeNode('u16'), sentinelCountNode(sentinel))]);

codec.encode([42, 99]); // 0x2a006300ffff
codec.decode(hex('2a006300ffff')); // [42n, 99n]
```

### Recursive types

Defined types may link back to themselves, directly or through other defined types, e.g. linked lists or trees. Their values nest as deep as the data goes.

```ts
// list = struct { value: u8, next: option<link(list)> }
const codec = getNodeValueCodec([root, program, list]);

codec.encode({ next: { __option: 'Some', value: { next: null, value: 2 } }, value: 1 }); // 0x01010200
```

A link back to its own type always has a variable size, so it cannot be the item of a fixed option or a zeroable option. Creating the codec of a type whose every value would nest another one, e.g. `loop = struct { next: link(loop) }`, throws a `CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE` error naming that type, since such a codec could never encode or decode anything.

## Visitors

### `getNodeCodecVisitor(linkables, options?)`

The visitor used by `getNodeCodec` under the hood. It returns a codec of decoded nodes for the visited node. On top of the `bytesEncoding` option, it accepts the `stack` of the visited node's ancestors, used to resolve links, and the `scope` of the enclosing instructions' provided values, used to resolve injected values.

```ts
const codec = visit(someTypeNode, getNodeCodecVisitor(linkables, { scope, stack }));
```

### `getNodeValueCodecVisitor(linkables, options?)`

The visitor used by `getNodeValueCodec` under the hood. It accepts the same options and returns a `Codec<unknown>` for the visited node, whose values are the values of the decoded nodes of `getNodeCodecVisitor`.

```ts
const codec = visit(someTypeNode, getNodeValueCodecVisitor(linkables, { scope, stack }));
```

### `getValueNodeVisitor(linkables, options?)`

Returns the value of the visited value node, in the same format as the codecs. For instance, an `integerValueNode` returns a `bigint`, a `constantValueNode` returns its encoded bytes, and an `injectedValueNode` returns the value provided for it.

```ts
visit(integerValueNode('42'), getValueNodeVisitor(linkables)); // 42n
```

### `getCodecAndValueVisitors(linkables, options?)`

Returns both visitors, sharing the same `stack` and `scope`.

```ts
const { codecVisitor, valueVisitor } = getCodecAndValueVisitors(linkables, { stack });
```
