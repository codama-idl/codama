# Codama ➤ Dynamic Instructions

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/dynamic-instructions.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/dynamic-instructions.svg?style=flat&label=%40codama%2Fdynamic-instructions
[npm-url]: https://www.npmjs.com/package/@codama/dynamic-instructions

This package provides a runtime Solana instruction builder that dynamically constructs `Instruction` (`@solana/instructions`). It provides instruction arguments encoding and validation, accounts resolution. Powers [`@codama/dynamic-client`](../dynamic-client/README.md) with `InstructionsBuilder`.

It also provides a **clear-signing display** layer that turns a concrete instruction into human-readable text — see [Instruction display](#instruction-display-clear-signing).

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

## Instruction display (clear signing)

Given an IDL enriched with `display` metadata (per [sRFC 39](https://github.com/solana-foundation/SRFCs/discussions/4)), this package resolves a concrete instruction into human-readable text for user verification. The result carries both presentation modes and lets the renderer choose:

```ts
type InstructionDisplay = {
    // A short imperative label, e.g. "Transfer" (derived from the instruction name when absent).
    intent: string;
    // The interpolated sentence, e.g. "Transfer 1.5 USDC to toly.sol", or `null` when a
    // placeholder cannot be resolved (the renderer then falls back to `fields`).
    interpolatedIntent: string | null;
    // The structured fallback list of labelled fields, e.g. [{ label: 'Amount', value: '1.5 USDC' }].
    fields: { label: string; value: string }[];
};
```

### `getInstructionDisplay(root, instruction, options?)`

Parses a raw `Instruction` (`@solana/instructions`) against the root and resolves its display. Returns `null` when the instruction cannot be identified or decoded (e.g. an instruction from an unknown program).

```ts
import { getInstructionDisplay } from '@codama/dynamic-instructions';

const display = await getInstructionDisplay(root, instruction);
// => { intent: 'Transfer', interpolatedIntent: 'Transfer 1500000 to 3Wnd5…5PxJX', fields: [...] } | null
```

### `getInstructionDisplayFromParsedInstruction(root, parsedInstruction, options?)`

The same, starting from an already-parsed instruction (`ParsedInstruction` from [`@codama/dynamic-parsers`](../dynamic-parsers/README.md)). Useful when you have already called `parseInstruction`.

```ts
import { parseInstruction } from '@codama/dynamic-parsers';
import { getInstructionDisplayFromParsedInstruction } from '@codama/dynamic-instructions';

const parsed = parseInstruction(root, instruction);
if (parsed) {
    const display = await getInstructionDisplayFromParsedInstruction(root, parsed);
}
```

### Options

Some display values live in on-chain account state (e.g. a token's `decimals`/`symbol` injected into an amount, or interpolation paths that read an account field). Supply `fetchAccount` to resolve them; without it, such values degrade gracefully and visibly: an amount whose scale cannot be resolved renders marked as raw in the field list (e.g. `1500000 (raw)`) so it cannot be mistaken for a scaled amount, any sentence referencing it is suppressed (`interpolatedIntent` becomes `null`, falling back to the fields), and `whenInjected` members remain visible.

`fetchAccount` returns Kit's `MaybeEncodedAccount` — an `exists` flag plus, when the account exists, its raw bytes. No decoding is required on your side: the display layer decodes the bytes itself using the referenced account's `accountLink` from the IDL, which already describes the layout. This makes `fetchEncodedAccount` a drop-in.

```ts
import type { Address } from '@solana/addresses';
import { fetchEncodedAccount } from '@solana/accounts';

const display = await getInstructionDisplay(root, instruction, {
    // Forward Kit's MaybeEncodedAccount for an address.
    fetchAccount: (address: Address) => fetchEncodedAccount(rpc, address),
});
```

Address presentation (`.sol` names, address-book aliases, truncation) is intentionally left to the renderer: `fields` and `interpolatedIntent` contain raw base58 addresses that the consuming wallet/UI formats as it sees fit.

## Offline display dictionary

An offline renderer — typically a hardware wallet — cannot reach an RPC to resolve the values above, nor a name service to present addresses. The **display dictionary** is a serialisable bundle of exactly that external data, assembled by an online companion and handed to the device so it can resolve a display with no network access.

```ts
type DisplayDictionary = {
    // Fetched on-chain account state, keyed by address (the offline counterpart of `fetchAccount`).
    accounts: ReadonlyMap<Address, EncodedAccount>;
    // Human-readable names, keyed by address — a `.sol` domain, token symbol, program label, alias…
    names: ReadonlyMap<Address, string>;
};
```

Only accounts that exist are stored: a missing key means "no data for this address", which is all the renderer can act on. It cannot, nor does it need to, distinguish an account that was never fetched from one that does not exist on-chain — both degrade the display the same way.

The `names` map is deliberately generic: it names an address, whatever the source. This is how an offline renderer recovers the presentation the online layer would delegate to it.

### Building the dictionary (online)

`getRequiredAccountsForDisplay(root, parsedInstruction)` returns the addresses whose account state a display would read — computed statically from the IDL and the instruction, with no network access. `getDisplayAccountMap` uses it to batch-fetch those accounts into the `accounts` map:

```ts
import { fetchEncodedAccounts } from '@solana/accounts';
import { parseInstruction } from '@codama/dynamic-parsers';
import { getDisplayAccountMap, getDisplayDictionaryCodec } from '@codama/dynamic-instructions';

const parsed = parseInstruction(root, instruction);
const accounts = await getDisplayAccountMap(root, parsed, addresses => fetchEncodedAccounts(rpc, addresses));

const dictionary = { accounts, names /* built from your own name sources */ };
const bytes = getDisplayDictionaryCodec().encode(dictionary);
```

> [!NOTE]
> A filler for the `names` map is **not** provided: its data comes from sources Codama has no opinion on (name services, token registries, curated label lists). Populate it yourself from whichever sources you trust.

### Consuming the dictionary (offline)

`fetchAccounts` (batch) is the counterpart of the display layer's `fetchAccount`; wire it to Kit's `fetchEncodedAccounts` for a single `getMultipleAccounts` round-trip. The bundle is encoded with byte codecs — `getDisplayDictionaryCodec` (and per-map `getDisplayAccountMapCodec` / `getDisplayNamedMapCodec`, each also available as split `…Encoder` / `…Decoder`). The offline renderer decodes it and resolves the display from the maps: account bytes are decoded through the IDL's `accountLink` exactly as online, and addresses are named from `names`.
