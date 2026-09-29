# Codama ➤ Dynamic Address Resolution

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/dynamic-address-resolution.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/dynamic-address-resolution.svg?style=flat&label=%40codama%2Fdynamic-address-resolution
[npm-url]: https://www.npmjs.com/package/@codama/dynamic-address-resolution

This package resolves the addresses of instruction accounts from a Codama IDL, e.g. by deriving PDAs from their seeds. It powers [`@codama/dynamic-client`](../dynamic-client/README.md).

## Installation

```sh
pnpm install @codama/dynamic-address-resolution
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Usage

Give `resolveInstructionAccountAddress` the path of an instruction account, from the root node, along with the accounts and data provided for the instruction.

```ts
import { resolveInstructionAccountAddress } from '@codama/dynamic-address-resolution';

const address = await resolveInstructionAccountAddress({
    accountsInput: { authority },
    dataInput: { amount: 1_000_000_000n },
    path: [root, root.program, instruction, vaultAccount],
});
```

The path is needed to follow links, e.g. to PDAs of other programs, and to resolve injected values from the `provides` of the instruction and its parents.

The `dataInput` uses the value format of [`@codama/dynamic-codecs`](../dynamic-codecs/README.md), e.g. `bigint` integers and `{ __kind, data }` enums.

## Resolution rules

A provided address is always used. Otherwise, the account resolves from its `defaultValue`, or from the `optionalAccountStrategy` of its instruction when it is optional and provided as `null`.

| Account                                    | `undefined`               | `null`                    |
| ------------------------------------------ | ------------------------- | ------------------------- |
| Required, without `defaultValue`           | Throws                    | Throws                    |
| Required, with `defaultValue`              | Resolves from its default | Resolves from its default |
| Optional (`isOptional: true`), without one | Throws                    | Optional account strategy |
| Optional, with `defaultValue`              | Resolves from its default | Optional account strategy |

Default values resolve as follows.

| Default value          | Resolves to                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `publicKeyValueNode`   | The given address.                                                                                           |
| `programIdValueNode`   | The address of the program of the instruction.                                                               |
| `programLinkNode`      | The address of the linked program.                                                                           |
| `accountValueNode`     | The address of another account of the instruction, resolved recursively.                                     |
| `dataValueNode`        | The address at the given path of the data, e.g. `config.owner`, using default values of fields when missing. |
| `pdaValueNode`         | The derived PDA. See [PDAs](#pdas).                                                                          |
| `conditionalValueNode` | One of its branches. See [Conditions](#conditions).                                                          |
| `injectedValueNode`    | Its provided value, resolved like any other default value.                                                   |
| `payerValueNode`       | The provided address, which is required.                                                                     |
| `identityValueNode`    | The provided address, which is required.                                                                     |

`accountBumpValueNode` and `accountDataValueNode` defaults are not supported, since they require fetching accounts.

### PDAs

Each seed is encoded using its declared type: constant seeds use their value, and variable seeds use the value provided by the `pdaValueNode`, from an account, the instruction data or a value node. Missing `remainderOptionTypeNode` seeds encode to zero bytes.

```ts
// seeds: [constant('vault'), variable('owner', publicKey), variable('name', string)]
pdaValueNode(pdaLinkNode('vault'), {
    seeds: [
        pdaSeedValueNode('owner', accountValueNode('owner')),
        pdaSeedValueNode('name', dataValueNode('config.name')),
    ],
});
```

The PDA is derived using the `programId` of the `pdaValueNode` if any, then the `programId` of the PDA, then the address of the program defining it.

### Conditions

With a `value`, a `conditionalValueNode` takes its `ifTrue` branch when its condition equals that value. Integers compare by value whether they are numbers or bigints, and enum variants compare by identifier, e.g. `'slow'` equals `enumValueNode('mode', 'slow')`. Without a `value`, it takes its `ifTrue` branch when the referenced account or data exists.

When no branch matches, optional accounts resolve using the optional account strategy and required accounts throw.

## `resolveStandalonePda(input)`

Derives a PDA outside of any instruction, from its path and the values of its variable seeds.

```ts
const [address, bump] = await resolveStandalonePda({
    path: [root, root.program, metadataPda],
    seedsInput: { authority, seed: 'idl' },
});
```

## Types generation

This package can generate the TypeScript input types of each instruction: `${Name}InstructionDataArgs` for its data, `${Name}Accounts` for its accounts, including remaining accounts as named `Address[]` lists, and `${Pda}Seeds` for the variable seeds of each PDA.

### CLI

```sh
npx @codama/dynamic-address-resolution generate-types <path/to/idl.json> <output-dir>
```

Writes `<idl-name>-address-resolution-types.ts` to the output directory.

### Programmatic

```ts
import { generateTypes } from '@codama/dynamic-address-resolution/codegen';

const source = generateTypes(idl);
```

The generated types can narrow the inputs of `resolveInstructionAccountAddress`.

```ts
import type { TransferAccounts, TransferInstructionDataArgs } from './generated/my-program-address-resolution-types';

const address = await resolveInstructionAccountAddress<TransferAccounts, TransferInstructionDataArgs>({
    accountsInput: { destination, source },
    dataInput: { amount: 1_000_000_000n },
    path,
});
```

## Helpers

- `toAddress(input)` normalises any `AddressInput`, i.e. an `Address`, a base58 string, or a legacy `PublicKey`-like object with `.toBase58()`, into an `Address`.
- `isPublicKeyLike(value)` is a duck-typed guard for legacy `PublicKey` objects.
- `isAddressConvertible(value)` returns `true` when `value` can be passed to `toAddress`.
- `OPTIONAL_NODE_KINDS` lists the type node kinds treated as optional.
