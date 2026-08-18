# Codama ➤ Dynamic Codecs

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/dynamic-codecs.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/dynamic-codecs.svg?style=flat&label=%40codama%2Fdynamic-codecs
[npm-url]: https://www.npmjs.com/package/@codama/dynamic-codecs

This package provides a set of helpers that provide `Codecs` for Codama nodes that describe data.

## Installation

```sh
pnpm install @codama/dynamic-codecs
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Functions

### `getNodeCodec(path, options?)`

Given the full `NodePath` of a node inside a Codama IDL, returns a `Codec<unknown>` (as defined in `@solana/codecs`) that enables encoding and decoding data for that node.

```ts
const codec = getNodeCodec([root, program, definedType]);
const bytes = codec.encode(someData);
const decodedData = codec.decode(bytes);
```

Note that it is important to provide the full `NodePath` of the node in order to properly follow link nodes inside the Codama IDL. Here is a more complex example illustrating how link nodes are resolved:

```ts
// Here we define a program with two types, one of which is a link to the other.
const root = rootNode(
    programNode({
        definedTypes: [
            definedTypeNode({ name: 'slot', type: numberTypeNode('u64') }),
            definedTypeNode({ name: 'lastSlot', type: definedTypeLinkNode('slot') }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    }),
);

// The codec for the linked `lastSlot` defined type is resolved using the `slot` defined type.
const codec = getNodeCodec([root, root.program, root.program.definedTypes[1]]);
expect(codec.encode(42)).toStrictEqual(hex('2a00000000000000'));
expect(codec.decode(hex('2a00000000000000'))).toBe(42n);
```

#### Options

The `getNodeCodec` function accepts the following options.

| Name            | Type            | Default    | Description                                              |
| --------------- | --------------- | ---------- | -------------------------------------------------------- |
| `bytesEncoding` | `BytesEncoding` | `"base64"` | The default encoding to use when formatting plain bytes. |

#### Decoded format

In the table below, we illustrate the format of each codec based on the node from which it was created.

Note that we purposefully avoid types such as `Uint8Array`, `Set` or `Map` in order to keep the format JSON compatible. For instance, plain bytes are not provided as `Uint8Array` but as a tuple of type `[BytesEncoding, string]` — e.g. `["base64", "HelloWorld++"]` — where the default bytes encoding is `base64` which is configurable via the `bytesEncoding` option.

| Node                                                                                                                           | Example                                                     | Notes                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`AccountLinkNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/linkNodes/AccountLinkNode.md)                         | -                                                           | Same as `AccountNode`                                                                       |
| [`AccountNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/AccountNode.md)                                           | -                                                           | Same as `node.data`                                                                         |
| [`DefinedTypeLinkNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/linkNodes/DefinedTypeLinkNode.md)                 | -                                                           | Same as `DefinedTypeNode`                                                                   |
| [`DefinedTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/DefinedTypeNode.md)                                   | -                                                           | Same as `node.type`                                                                         |
| [`InstructionArgumentLinkNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/linkNodes/InstructionArgumentLinkNode.md) | -                                                           | Same as `InstructionArgumentNode`                                                           |
| [`InstructionArgumentNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/InstructionArgumentNode.md)                   | -                                                           | Same as `node.type`                                                                         |
| [`InstructionLinkNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/linkNodes/InstructionLinkNode.md)                 | -                                                           | Same as `InstructionNode`                                                                   |
| [`InstructionNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/InstructionNode.md)                                   | -                                                           | Same as a `StructTypeNode` containing all `node.arguments`                                  |
| [`AmountTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/AmountTypeNode.md)                           | `42`                                                        | Same as `NumberTypeNode`                                                                    |
| [`ArrayTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/ArrayTypeNode.md)                             | `[1, 2, 3]`                                                 |                                                                                             |
| [`BooleanTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/BooleanTypeNode.md)                         | `true` or `false`                                           |                                                                                             |
| [`BytesTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/BytesTypeNode.md)                             | `["base16", "00ffaa"]`                                      | Uses `bytesEncoding` option to decode                                                       |
| [`DateTimeTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/DateTimeTypeNode.md)                       | `42`                                                        | Same as `NumberTypeNode`                                                                    |
| [`EnumTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/EnumTypeNode.md)                               | `2` or `{ __kind: "move", x: 12, y: 34 }`                   | Uses number indices for scalar enums. Uses discriminated unions otherwise.                  |
| [`FixedSizeTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/FixedSizeTypeNode.md)                     | -                                                           | Same as `node.type`                                                                         |
| [`HiddenPrefixTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/HiddenPrefixTypeNode.md)               | -                                                           | Same as `node.type`                                                                         |
| [`HiddenSuffixTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/HiddenSuffixTypeNode.md)               | -                                                           | Same as `node.type`                                                                         |
| [`MapTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/MapTypeNode.md)                                 | `{ key1: "value1", key2: "value2" }`                        | Represent `Maps` as `objects`                                                               |
| [`NumberTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/NumberTypeNode.md)                           | `42`                                                        | This could be a `bigint`                                                                    |
| [`OptionTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/OptionTypeNode.md)                           | `{ __option: "Some", value: 42 }` or `{ __option: "None" }` | Uses value objects (instead of `T \| null`) to avoid loosing information on nested options. |
| [`PostOffsetTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/PostOffsetTypeNode.md)                   | -                                                           | Same as `node.type`                                                                         |
| [`PreOffsetTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/PreOffsetTypeNode.md)                     | -                                                           | Same as `node.type`                                                                         |
| [`PublicKeyTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/PublicKeyTypeNode.md)                     | `"3QC7Pnv2KfwwdC44gPcmQWuZXmRSbUpmWMJnhenMC8CU"`            | Uses base58 representations of public keys                                                  |
| [`RemainderOptionTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/RemainderOptionTypeNode.md)         | `{ __option: "Some", value: 42 }` or `{ __option: "None" }` | Same as `OptionTypeNode`                                                                    |
| [`SentinelTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/SentinelTypeNode.md)                       | -                                                           | Same as `node.type`                                                                         |
| [`SetTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/SetTypeNode.md)                                 | `[1, 2, 3]`                                                 | Same as `ArrayTypeNode`                                                                     |
| [`SizePrefixTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/SizePrefixTypeNode.md)                   | -                                                           | Same as `node.type`                                                                         |
| [`SolAmountTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/SolAmountTypeNode.md)                     | `42`                                                        | Same as `NumberTypeNode`                                                                    |
| [`StringTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/StringTypeNode.md)                           | `"Hello World"`                                             | Uses the encoding defined in the node — i.e. `node.encoding`                                |
| [`StructTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/StructTypeNode.md)                           | `{ name: "John", age: 42 }`                                 |                                                                                             |
| [`TupleTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/TupleTypeNode.md)                             | `["John", 42]`                                              | Uses arrays to create tuples                                                                |
| [`ZeroableOptionTypeNode`](https://github.com/codama-idl/spec/blob/main/v1/docs/typeNodes/ZeroableOptionTypeNode.md)           | `{ __option: "Some", value: 42 }` or `{ __option: "None" }` | Same as `OptionTypeNode`                                                                    |

### `getNodeCodecVisitor(linkables, options?)`

This visitor is used by `getNodeCodec` under the hood. It returns a `Codec<unknown>` for the visited node.

```ts
return visit(someTypeNode, getNodeCodecVisitor(linkables));
```

### `getValueNodeVisitor(linkables, options?)`

This visitor is used by the `getValueNodeVisitor` under the hood. It returns an `unknown` value for the visited `ValueNode`.

```ts
return visit(someValueNode, getValueNodeVisitor(linkables));
```
