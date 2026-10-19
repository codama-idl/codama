# Codama ➤ Dynamic Parsers

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/dynamic-parsers.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/dynamic-parsers.svg?style=flat&label=%40codama%2Fdynamic-parsers
[npm-url]: https://www.npmjs.com/package/@codama/dynamic-parsers

This package provides a set of helpers that, given any Codama IDL, dynamically identifies and parses any byte array into deserialized accounts, events, and instructions.

## Installation

```sh
pnpm install @codama/dynamic-parsers
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Decoded nodes

All parsers return the [decoded nodes](../dynamic-codecs/README.md#decoded-nodes) of `@codama/dynamic-codecs`: the `path` of the identified node, the decoded `value`, the `preOffset` and `postOffset` of the cursor, and the decoded nodes of its `data`, absent for instructions without data.

```ts
const account = parseAccountData(rootNode, bytes);
account?.path; // [rootNode, programNode, accountNode]
account?.value; // { discriminator: 1n, owner: '9BbW...ftkT', amount: 42n }
account?.data; // the decoded struct, with its `fields`
```

The `value` uses the value format of [`getNodeValueCodec`](../dynamic-codecs/README.md#value-format). For instance, integers are `bigint`s, struct keys are the raw field identifiers and enums are `{ __kind, __discriminator, data }` objects. The decoded nodes of the `data` keep the node of each value, e.g. to [format](../dynamic-codecs/README.md#formatting) it.

All parsers return `undefined` when the bytes are unparsable: either nothing is identified, or the identified node cannot decode them, e.g. truncated bytes whose discriminator matches.

## Functions

### `parseAccountData(rootNode, bytes, options?)`

Identifies the account node of the provided bytes and decodes them with it.

```ts
const account = parseAccountData(rootNode, bytes);
// ^ DecodedAccountNode | undefined
```

### `parseEventData(rootNode, bytes, options?)`

Identifies the event node of the provided bytes and decodes them with it.

```ts
const event = parseEventData(rootNode, bytes);
// ^ DecodedEventNode | undefined
```

### `parseInstructionData(rootNode, bytes, options?)`

Identifies the instruction node of the provided bytes and decodes them with it.

```ts
const instruction = parseInstructionData(rootNode, bytes);
// ^ DecodedInstructionNode | undefined
```

### `parseData(rootNode, bytes, kind?, options?)`

Identifies the node of the given kind(s) of the provided bytes and decodes them with it. All kinds are searched by default.

```ts
const parsed = parseData(rootNode, bytes, ['accountNode', 'eventNode']);
// ^ DecodedAccountNode | DecodedEventNode | undefined
```

All the functions above accept the following options.

| Name             | Type                 | Description                                                                                                                                                                       |
| ---------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `programAddress` | `string`             | Restricts the search to the programs matching this address. See [Program selection](#program-selection).                                                                          |
| `bytesEncoding`  | `BytesEncoding`      | The encoding of decoded plain bytes, e.g. `'base16'` decodes them as `["base16", "0102"]`. Defaults to `base64`.                                                                  |
| `linkables`      | `LinkableDictionary` | The linkable nodes of the tree, e.g. from `getLinkablesFromNode(rootNode)`, to avoid recording them again when parsing many times. Defaults to recording them from the root node. |

### `parseInstruction(rootNode, instruction, options?)`

Parses an `Instruction`, as defined in `@solana/instructions`. It returns a `ParsedInstruction`: the decoded instruction node, plus its account metas, split into three lists.

- `accounts`: the named accounts whose identity is certain, each `AccountMeta` carrying the `identifier` of its instruction account, in order.
- `unidentifiedAccounts`: the account metas whose identity is ambiguous, see below.
- `remainingAccounts`: the account metas beyond all named accounts, e.g. the signers of a multisig.

```ts
const parsed = parseInstruction(rootNode, instruction);
// ^ ParsedInstruction | undefined

if (parsed) {
    parsed.value; // { amount: 42n }
    parsed.accounts; // [{ address, role, identifier: 'source' }, ...]
    parsed.unidentifiedAccounts; // []
    parsed.remainingAccounts; // [{ address, role }, ...]
}
```

Absent optional accounts are never named, following the `optionalAccountStrategy` of the instruction.

- `programId`, the default: absent optional accounts are passed as the address of the program. Their slot is left out of `accounts`, and so is the program address it holds.
- `omitted`: absent optional accounts are left out, so the accounts after them shift. When the number of account metas tells which optional accounts are absent, every account is named. Otherwise, e.g. when one of two optional accounts is absent, or when remaining accounts may follow the named accounts, the accounts whose position is certain are named, and the others are returned as `unidentifiedAccounts`, rather than under a name that may be wrong.

```ts
// Accounts: source, referrer (optional), memo (optional), destination.
// Metas:    [A, B, C], with the `omitted` strategy.
parsed.accounts; // [{ address: A, identifier: 'source' }, { address: C, identifier: 'destination' }]
parsed.unidentifiedAccounts; // [{ address: B }]: either the referrer or the memo.
```

It uses the instruction's `programAddress` to restrict the search to the matching program, including any of the root node's `additionalPrograms`. When no program of the root matches that address, nothing is parsed: matching an unknown program against another program's candidates would confidently misattribute the data, which matters when the result is displayed to end users (e.g. clear signing). It accepts the `bytesEncoding` and `linkables` options.

## Discriminators

Accounts, events and instructions are identified using their `discriminators`, which must all match the provided bytes.

- `constantDiscriminatorNode`: the bytes contain the encoded constant at the given offset.
- `fieldDiscriminatorNode`: the bytes contain the encoded default value of the field at the given `path` and offset. The path is relative to the node's `data`, follows linked types, and must point to a struct field, e.g. `header.kind` or `entries[0].kind`. Injected default values are resolved using the `provides` of the instruction.
- `sizeDiscriminatorNode`: the bytes have exactly the given size.

## Program selection

All functions above search the root node's main program as well as its `additionalPrograms`, in that order. Additionally, they all accept an optional `programAddress` option that restricts the search to the programs matching that address. When no program matches, nothing is identified.

```ts
const instruction = parseInstructionData(rootNode, bytes, { programAddress: address });
```

The single-non-discriminated-candidate fallback follows the same selection when a `programAddress` is provided. Without one, it stays conservative and only applies to the main program, since bytes alone cannot tell which program a discriminator-less candidate belongs to.

### `identifyAccountData`

This function tries to match the provided bytes to an account node, returning a `NodePath<AccountNode>` object if the identification was successful, or `undefined` otherwise. It is used by the `parseAccountData` function under the hood.

```ts
const path = identifyAccountData(root, bytes);
// ^ NodePath<AccountNode> | undefined

if (path) {
    const accountNode: AccountNode = getLastNodeFromPath(path);
}
```

### `identifyInstructionData`

This function tries to match the provided bytes to an instruction node, returning a `NodePath<InstructionNode>` object if the identification was successful, or `undefined` otherwise. It is used by the `parseInstructionData` function under the hood.

```ts
const path = identifyInstructionData(root, bytes);
// ^ NodePath<InstructionNode> | undefined

if (path) {
    const instructionNode: InstructionNode = getLastNodeFromPath(path);
}
```

### `identifyEventData`

This function tries to match the provided bytes to an event node, returning a `NodePath<EventNode>` object if the identification was successful, or `undefined` otherwise. It is used by the `parseEventData` function under the hood.

```ts
const path = identifyEventData(root, bytes);
// ^ NodePath<EventNode> | undefined

if (path) {
    const eventNode: EventNode = getLastNodeFromPath(path);
}
```
