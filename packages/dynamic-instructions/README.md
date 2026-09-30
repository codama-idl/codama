# Codama ➤ Dynamic Instructions

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/dynamic-instructions.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/dynamic-instructions.svg?style=flat&label=%40codama%2Fdynamic-instructions
[npm-url]: https://www.npmjs.com/package/@codama/dynamic-instructions

This package provides a runtime Solana instruction builder that dynamically constructs `Instruction` (`@solana/instructions`). It encodes and validates instruction data and resolves instruction accounts. Powers [`@codama/dynamic-client`](../dynamic-client/README.md) with `InstructionsBuilder`.

It also provides a **clear-signing display** layer that turns a concrete instruction into human-readable text — see [Instruction display](#instruction-display-clear-signing).

## Installation

```sh
pnpm install @codama/dynamic-instructions
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Types generation

This package can emit TypeScript types per instruction: `${Name}InstructionDataArgs`, `${Name}Accounts` and `${Name}AccountsWithData`, `${Name}Signers` aliases, plus an aggregate `${Program}InstructionBuilders` map.

The `${Name}InstructionDataArgs` and `${Name}Accounts` types are emitted by [`@codama/dynamic-address-resolution/codegen`](../dynamic-address-resolution/README.md) and re-used here, since the accounts that may be omitted depend on the resolution rules.

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

Every function takes the path of the instruction from the root node, e.g. `[root, root.program, instruction]`, so links and injected values resolve from the program defining the instruction, which may be an additional program.

### `createInstructionsBuilder(path)`

Creates an async function building the `Instruction` (`@solana/instructions`) of an instruction. It encodes the provided data, resolves the accounts that are not provided from their default values, and uses the address of the program defining the instruction.

```ts
const build = createInstructionsBuilder([root, root.program, transfer]);
const instruction = await build({
    // Remaining accounts are provided as lists of addresses under their identifier.
    accounts: { authority, destination, signers: [signerA, signerB], source },
    data: { amount: 1_000_000_000n },
    // Accounts with `isSigner: 'either'` to mark as signers.
    signers: ['authority'],
});
```

Types generated via [`generate-types`](#types-generation) can type its inputs.

```ts
import type {
    TransferAccounts,
    TransferInstructionDataArgs,
    TransferSigners,
} from './generated/<idl-name>-instruction-types';

const build = createInstructionsBuilder<TransferInstructionDataArgs, TransferAccounts, TransferSigners>(path);
```

### `encodeInstructionData(path, data?)`

Encodes the data of an instruction using its codec from [`@codama/dynamic-codecs`](../dynamic-codecs/README.md), including the default values of its fields, e.g. discriminators.

```ts
const bytes = encodeInstructionData([root, root.program, transfer], { amount: 1_000_000_000n });
```

Codama errors raised while encoding are thrown as is, e.g. a `CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` error for a value of the wrong type. Other encoding errors, e.g. an integer out of range, throw a `CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA` error whose `cause` is the original error. Use `createInstructionDataEncoder(path)` to create the codec once and encode several times.

### `createAccountMetas({ path, accounts?, data?, signers? })`

Creates the `AccountMeta`s of an instruction: its accounts, in order, followed by its remaining accounts. Accounts that are not provided are resolved from their default values, e.g. PDAs derived from the data, and optional accounts provided as `null` follow the `optionalAccountStrategy` of the instruction.

```ts
const accountMetas = await createAccountMetas({
    accounts: { authority, destination, source },
    data: { amount: 1_000_000_000n },
    path: [root, root.program, transfer],
});
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
