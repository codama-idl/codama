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

| Name            | Type            | Default    | Description                                  |
| --------------- | --------------- | ---------- | -------------------------------------------- |
| `bytesEncoding` | `BytesEncoding` | `"base64"` | The encoding used when decoding plain bytes. |

```ts
const codec = getNodeValueCodec([root, program, definedType], { bytesEncoding: 'base16' });
```

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
| [`MapTypeNode`](https://github.com/codama-idl/spec/blob/main/docs/typeNodes/MapTypeNode.md)                         | `{ key1: "value1", key2: "value2" }`                         | An object.                                                                                                               |
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

Encoding throws a `CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` error when a value does not match its type, e.g. a string for an integer or a missing field without a default value, rather than encoding unexpected bytes. Structs and maps must be plain objects, so `Map`s or class instances are rejected. Its `nodePath` context is the path of the node that rejected the value, from the root.

Sets also throw a `CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM` error when two items encode to the same bytes, e.g. `[42, 42n]`. Its context gives the `index` of the duplicate, the `firstIndex` of the item it equals and the `nodePath` of the set. Decoding keeps duplicates, so existing data reads as it is.

```ts
const codec = getNodeValueCodec([root, program, instruction]);
codec.encode({ amount: 'x' });
// throws with { nodePath: [root, program, instruction, data, amountField, amountType], nodeKind: 'integerTypeNode', … }
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

### `getNodeValueCodecVisitor(linkables, options?)`

The visitor used by `getNodeValueCodec` under the hood. It returns a `Codec<unknown>` for the visited node. On top of the `bytesEncoding` option, it accepts the `stack` of the visited node's ancestors, used to resolve links, and the `scope` of the enclosing instructions' provided values, used to resolve injected values.

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
