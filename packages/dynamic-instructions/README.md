# Codama ➤ Dynamic Instructions

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/dynamic-instructions.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/dynamic-instructions.svg?style=flat&label=%40codama%2Fdynamic-instructions
[npm-url]: https://www.npmjs.com/package/@codama/dynamic-instructions

This package provides a runtime Solana instruction builder that dynamically constructs `Instruction` (`@solana/instructions`). It provides instruction arguments encoding and validation, accounts resolution. Powers [`@codama/dynamic-client`](../dynamic-client/README.md) with `InstructionsBuilder`.

## Installation

```sh
pnpm install @codama/dynamic-instructions
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Types generation

This package can emit TypeScript types per-instruction - `${Name}Args`, `${Name}Accounts`, `${Name}Resolvers`, and `${Name}Signers` aliases, plus an aggregate `${Program}InstructionBuilders` map.

The `${Name}Args` / `${Name}Accounts` / `${Name}Resolvers` type contracts that resolvers operate on are emitted by [`@codama/dynamic-address-resolution/codegen`](../dynamic-address-resolution/README.md) and re-used here. The builder depends on resolution because the input shape it accepts (e.g. optional auto-resolvable accounts) is a direct consequence of resolution rules.

### CLI

```sh
npx @codama/dynamic-instructions generate-types <path/to/idl.json> <output-dir>
```

Writes `<idl-name>-instruction-types.ts` to the output directory.

### Programmatic

```ts
import { generateTypes } from '@codama/dynamic-instructions/codegen';

const source = generateTypes(idl);
```

## Functions

### `createInstructionsBuilder(root, ixNode)`

Creates an async instruction builder function for a given `InstructionNode`. The returned function validates inputs, resolves defaults, encodes arguments, and assembles the final `Instruction`.

**Untyped:**

```ts
const build = createInstructionsBuilder(root, ixNode);
const instruction = await build(args, accounts, signers, resolvers);
```

**Typed:**

> Types are generated via [`generate-types`](#types-generation).

```ts
import type { CreateItemAccounts, CreateItemArgs, CreateItemResolvers } from './generated/<idl-name>-instruction-types';

const build = createInstructionsBuilder<CreateItemArgs, CreateItemAccounts, [], CreateItemResolvers>(root, ixNode);
const instruction = await build({ name: 'item' }, { authority }, [], {
    resolveOwner: async (args, accounts) => accounts.authority,
});
```

### `createAccountMeta(root, ixNode, argumentsInput?, accountsInput?, signers?, resolversInput?)`

Resolves and builds `AccountMeta[]` for an instruction. Handles PDA derivation, default value resolution, optional accounts, and signer disambiguation.

**Untyped:**

```ts
const accountMetas = await createAccountMeta(root, ixNode, args, accounts, ['owner'], resolvers);
```

**Typed:**

> Types are generated via [`generate-types`](#types-generation).

```ts
import type { CreateItemAccounts, CreateItemArgs, CreateItemResolvers } from './generated/<idl-name>-instruction-types';

const accountMetas = await createAccountMeta<CreateItemAccounts, CreateItemArgs, CreateItemResolvers>(
    root,
    ixNode,
    { name: 'item' },
    { authority },
    ['owner'],
    { resolveOwner: async (args, accounts) => accounts.authority },
);
```

### `encodeInstructionArguments(root, ixNode, argumentsInput?)`

Encodes instruction arguments into a `ReadonlyUint8Array` buffer according to the Codama schema. Auto-encodes arguments with `defaultValueStrategy: 'omitted'` (e.g. discriminators).

**Untyped:**

```ts
const data = encodeInstructionArguments(root, ixNode, { amount: 1_000_000_000 });
```

**Typed:**

> Types are generated via [`generate-types`](#types-generation).

```ts
import type { TransferArgs } from './generated/<idl-name>-instruction-types';

const data = encodeInstructionArguments<TransferArgs>(root, ixNode, { amount: 1_000_000_000n });
```
