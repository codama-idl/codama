# Codama ➤ Dynamic Address Resolution

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/dynamic-address-resolution.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/dynamic-address-resolution.svg?style=flat&label=%40codama%2Fdynamic-address-resolution
[npm-url]: https://www.npmjs.com/package/@codama/dynamic-address-resolution

This package provides the address resolution functionality for instruction accounts of a Codama IDL. It powers [`@codama/dynamic-client`](../dynamic-client/README.md).

## Installation

```sh
pnpm install @codama/dynamic-address-resolution
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Types

- `AccountsInput`, `ArgumentsInput` — user-input shapes for accounts and arguments.
- `ResolverFn`, `ResolversInput`, `ResolverFnInput` — user-supplied custom resolver functions.
- `AddressInput`, `PublicKeyLike` — accepted address-like inputs (modern `Address` strings, base58 strings, or legacy `PublicKey`-like objects with `.toBase58()`).

## Types generation

> For now, types for arguments, accounts, custom resolvers, and PDA seeds can be produced via [`@codama/dynamic-client`](../dynamic-client/README.md)'s `generate-client-types` command, and passed as generics to the functions. Types generation for this package will be added in a follow-up release.

## Functions

### `resolveInstructionAccountAddress(input)`

Resolves the on-chain `Address` for a single `InstructionAccountNode` of an instruction, applying default values, PDA derivation, conditional resolution, and any user-supplied custom resolvers. Returns `null` for optional accounts that resolve to "omitted".

**Untyped:**

```ts
const address = await resolveInstructionAccountAddress({
    accountsInput: { authority: ownerAddress },
    argumentsInput: { amount: 1_000_000_000n },
    ixAccountNode,
    ixNode,
    root,
});
```

**Typed:**

```ts
import type { TransferSolAccounts, TransferSolArgs } from './generated/system-program-idl-types';

const address = await resolveInstructionAccountAddress<TransferSolAccounts, TransferSolArgs>({
    accountsInput: { source, destination },
    argumentsInput: { amount: 1_000_000_000n },
    ixAccountNode,
    ixNode,
    root,
});
```

#### Automatic resolution rules

Accounts (PDAs, program ids, constants) with a `defaultValue` are resolved automatically and may be omitted from `accountsInput`.

| Account scenario                                                | Type in `accountsInput`        | Auto resolution                                                                              |
| --------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| Required account without `defaultValue`                         | `{ system: Address }`          | No                                                                                           |
| Required account with `defaultValue`<br>(PDA, programId, etc.)  | `{ system?: Address }`         | Auto-resolved to `defaultValue` if omitted                                                   |
| Optional account (`isOptional: true`)<br>without `defaultValue` | `{ system: Address \| null }`  | Resolved via `optionalAccountStrategy`,<br>if provided as `null`                             |
| Optional account (`isOptional: true`)<br>with `defaultValue`    | `{ system?: Address \| null }` | - `null` resolves via `optionalAccountStrategy`<br>- `undefined` resolves via `defaultValue` |

Auto-resolved kinds include:

- **PDA accounts** — derived from seeds defined in the IDL (`pdaValueNode`).
- **Program IDs** — known program addresses (e.g. System Program, Token Program).
- **Constants** — `constantValueNode` defaults.
- **Conditional values** — `conditionalValueNode` defaults.
- **Custom resolvers** — `resolverValueNode` defaults supplied via `resolversInput`.

### `resolveStandalonePda(root, pdaNode, seedInputs?)`

Derives a `ProgramDerivedAddress` for a `PdaNode` outside any instruction context — seeds are supplied directly as a `Record<string, unknown>`.

```ts
const pdaNode = root.program.pdas.find(p => p.name === 'metadata')!;
const [pda, bump] = await resolveStandalonePda(root, pdaNode, {
    authority: ownerAddress,
    seed: 'idl',
});
```

### `createCodecInputTransformer(typeNode, root, options?)`

Returns a function that transforms user-supplied input into the codec-compatible shape expected by [`@codama/dynamic-codecs`](../dynamic-codecs/README.md) — e.g. `Uint8Array` → `[encoding, hex]`.

```ts
import { bytesTypeNode } from 'codama';

const transform = createCodecInputTransformer(bytesTypeNode(), root, {
    bytesEncoding: 'base16',
});

transform(new Uint8Array([72, 101, 108, 108, 111]));
// => ['base16', '48656c6c6f']
```

### `createDefaultValueEncoderVisitor(codec)`

Returns a `Visitor<ReadonlyUint8Array>` that encodes default `ValueNode`s.

```ts
import { getNodeCodec } from '@codama/dynamic-codecs';
import { bytesValueNode, visit } from 'codama';

const codec = getNodeCodec([root, root.program, argNode]);
const encoder = createDefaultValueEncoderVisitor(codec);
const bytes = visit(bytesValueNode('base16', 'a1b2c3'), encoder);
```

### Helpers

#### `toAddress(input)`

Normalizes any `AddressInput` (modern `Address` string, base58 string, or legacy `PublicKey`-like object with `.toBase58()`) into an `Address`.

```ts
const a1 = toAddress('11111111111111111111111111111111');
const a2 = toAddress(new PublicKey());
```

#### `isPublicKeyLike(value)`

Duck-typed guard for legacy `PublicKey` objects.

```ts
if (isPublicKeyLike(value)) {
    const addr = toAddress(value);
}
```

#### `isAddressConvertible(value)`

Returns `true` if `value` is a string `Address` or a `PublicKeyLike` object — i.e. safe to pass to `toAddress`.

```ts
if (isAddressConvertible(input)) {
    return toAddress(input);
}
```

#### Constants

- `OPTIONAL_NODE_KINDS` — type-node kinds treated as optional.
