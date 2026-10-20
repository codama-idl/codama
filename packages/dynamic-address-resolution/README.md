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

The path is needed to follow links, e.g. to PDAs of other programs, and to resolve injected values from the `provides` of the instruction and its parents. Links are followed using the linkable nodes of the tree, which every function of this package records from the root of the path unless given as `linkables`. Record them once with `getLinkablesFromNode(root)` and pass them when resolving several times.

```ts
import { getLinkablesFromNode } from 'codama';

const linkables = getLinkablesFromNode(root);
const addresses = await Promise.all(
    accountPaths.map(path => resolveInstructionAccountAddress({ accountsInput, dataInput, linkables, path })),
);
```

The `dataInput` uses the value format of [`@codama/dynamic-codecs`](../dynamic-codecs/README.md), e.g. `bigint` integers and `{ __kind, data }` enums.

### Reading account data

Some default values read the data of accounts, e.g. an owner defaulting to `accountDataValueNode('mint', { path: 'mintAuthority' })`, or a seed reading `dataValueNode('mint.data.decimals')` where `mint` is a public key linking to the mint account. Pass a `fetchAccounts` function returning these accounts, which must exist. Their data is decoded using the IDL, following `accountLink`s.

```ts
import { assertAccountsExist, fetchEncodedAccounts } from '@solana/accounts';

const fetchAccounts: FetchAccountsFn = async addresses => {
    const accounts = await fetchEncodedAccounts(rpc, addresses);
    assertAccountsExist(accounts);
    return accounts;
};
```

```ts
const address = await resolveInstructionAccountAddress({
    accountsInput: { mint },
    fetchAccounts,
    path: [root, root.program, instruction, ownerAccount],
});
```

Errors come from Kit: `assertAccountsExist` throws for accounts that do not exist, and data that does not decode throws `SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT`. Errors thrown by `fetchAccounts` are thrown as is. Reading account data without a `fetchAccounts` function throws a `CODAMA_ERROR__DYNAMIC_CLIENT__FETCH_ACCOUNTS_MISSING` error, whose `path` is the path of the account to read. `readsAccountData(path)` tells whether building an instruction may read account data, and thus needs `fetchAccounts`; the generated types of `@codama/dynamic-instructions` and `@codama/dynamic-client` use it to require the option.

Accounts requested together are fetched in a single call, and each account is fetched once per resolution. Use `getBatchedFetchAccounts(fetchAccounts)` to share these batches and this cache across several resolutions, e.g. all the accounts of an instruction.

Instruction data fields whose default value is injected from account data, e.g. a `decimals` field provided by `accountDataValueNode('mint', { path: 'decimals' })`, cannot be evaluated by codecs, which are synchronous. `resolveInstructionDataDefaultValues` resolves them beforehand, for the `resolvedDefaultValues` codec option.

```ts
const resolvedDefaultValues = await resolveInstructionDataDefaultValues({
    accountsInput: { mint },
    dataInput: { amount: 42n },
    fetchAccounts,
    path: [root, root.program, transferChecked],
});
const bytes = getNodeValueCodec(path, { resolvedDefaultValues }).encode({ amount: 42n });
```

## Resolution rules

A provided address is always used. Otherwise, the account resolves from its `defaultValue`, or from the `optionalAccountStrategy` of its instruction when it is optional and provided as `null`.

| Account                                    | `undefined`               | `null`                    |
| ------------------------------------------ | ------------------------- | ------------------------- |
| Required, without `defaultValue`           | Throws                    | Throws                    |
| Required, with `defaultValue`              | Resolves from its default | Resolves from its default |
| Optional (`isOptional: true`), without one | Throws                    | Optional account strategy |
| Optional, with `defaultValue`              | Resolves from its default | Optional account strategy |

A default value may resolve to nothing, e.g. an `accountValueNode` referring to an optional account omitted by the `omitted` strategy, or a `conditionalValueNode` without a matching branch. Optional accounts then resolve using the optional account strategy, and required accounts throw a `CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING` error rather than being left out of the instruction.

Default values resolve as follows.

| Default value          | Resolves to                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `publicKeyValueNode`   | The given address.                                                                                           |
| `programIdValueNode`   | The address of the program of the instruction.                                                               |
| `programLinkNode`      | The address of the linked program.                                                                           |
| `accountValueNode`     | The address of another account of the instruction, resolved recursively.                                     |
| `dataValueNode`        | The address at the given path of the data, e.g. `config.owner`, using default values of fields when missing. |
| `accountDataValueNode` | The address at the given path of the data of an account. See [Reading account data](#reading-account-data).  |
| `pdaValueNode`         | The derived PDA. See [PDAs](#pdas).                                                                          |
| `conditionalValueNode` | One of its branches. See [Conditions](#conditions).                                                          |
| `injectedValueNode`    | Its provided value, resolved like any other default value.                                                   |
| `payerValueNode`       | The provided address, which is required.                                                                     |
| `identityValueNode`    | The provided address, which is required.                                                                     |

`accountBumpValueNode` defaults are not supported.

Paths of data values may cross the `accountLink` of a public key, with a `.data` segment, e.g. `mint.data.decimals`, which reads the data of that account. See [Reading account data](#reading-account-data).

### PDAs

Each seed is encoded using its declared type: constant seeds use their value, and variable seeds use the value provided by the `pdaValueNode`, from an account, the instruction data, the data of an account injected through an `accountDataValueNode`, or a value node. Injected seed values resolve like the values they inject, e.g. an injected `accountValueNode` gives the address of that account. Missing `remainderOptionTypeNode` seeds encode to zero bytes.

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

Derives a PDA outside of any instruction, from its path and the values of its variable seeds. It uses the given `programId`, or else the `programId` of the PDA, or else the address of the program defining it. Pass a `programId` for PDAs that instructions derive from another program through their `pdaValueNode.programId`.

```ts
const [address, bump] = await resolveStandalonePda({
    path: [root, root.program, metadataPda],
    programId: otherProgramAddress, // optional
    seedsInput: { authority, seed: 'idl' },
});
```

## Types generation

This package can generate the TypeScript input types of each instruction: `${Name}InstructionDataArgs` for its data, `${Name}Accounts` for its accounts, including remaining accounts as named `Address[]` lists, and `${Pda}Seeds` for the variable seeds of each PDA. Linked types are inlined, following the program of their link, except recursive types, which are emitted once as `${Type}Args` aliases, prefixed with the name of their program when it is an additional program, e.g. `OtherProgramNodeArgs`.

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
