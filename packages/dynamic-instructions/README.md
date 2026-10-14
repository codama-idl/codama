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

This package can emit TypeScript types per instruction: `${Name}InstructionDataArgs`, `${Name}Accounts` and `${Name}AccountsWithData`, `${Name}Signers` aliases, `${Name}ReadsAccountData` flags, plus an aggregate `${Program}InstructionBuilders` map.

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

Every function takes the path of the instruction from the root node, e.g. `[root, root.program, instruction]`, so links and injected values resolve from the program defining the instruction, which may be an additional program. Links are followed using the linkable nodes of the tree, which every function records from the root of the path unless given as a `linkables` option, e.g. from `getLinkablesFromNode(root)`, to avoid recording them again.

### `createInstructionsBuilder(path, options?)`

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

Default values may read the data of accounts, e.g. the `decimals` of a mint injected into the data of `transferChecked`. Pass a `fetchAccounts` option returning these accounts: each build fetches every account it reads once, in as few calls as possible. The generated `${Name}ReadsAccountData` types make it required for the instructions reading account data. See [Reading account data](../dynamic-address-resolution/README.md#reading-account-data).

```ts
const build = createInstructionsBuilder<
    TransferCheckedInstructionDataArgs,
    TransferCheckedAccounts,
    TransferCheckedSigners,
    TransferCheckedReadsAccountData // true: `fetchAccounts` is required
>([root, root.program, transferChecked], { fetchAccounts });
const instruction = await build({ accounts: { authority, destination, mint, source }, data: { amount: 42n } });
```

### `encodeInstructionData(path, data?, options?)`

Encodes the data of an instruction using its codec from [`@codama/dynamic-codecs`](../dynamic-codecs/README.md), including the default values of its fields, e.g. discriminators.

```ts
const bytes = encodeInstructionData([root, root.program, transfer], { amount: 1_000_000_000n });
```

Codama errors raised while encoding are thrown as is, e.g. a `CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` error for a value of the wrong type. Other encoding errors, e.g. an integer out of range, throw a `CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA` error whose `cause` is the original error. Use `createInstructionDataEncoder(path)` to create the codec once and encode several times.

Default values injected from account data cannot be evaluated while encoding: resolve them with `resolveInstructionDataDefaultValues` from [`@codama/dynamic-address-resolution`](../dynamic-address-resolution/README.md#reading-account-data) and pass them as the `resolvedDefaultValues` option. The encoder then creates a codec for these values on each call, since they differ from one instruction to the next.

### `createAccountMetas({ path, accounts?, data?, fetchAccounts?, signers? })`

Creates the `AccountMeta`s of an instruction: its accounts, in order, followed by its remaining accounts. Accounts that are not provided are resolved from their default values, e.g. PDAs derived from the data, and optional accounts provided as `null` follow the `optionalAccountStrategy` of the instruction. Default values reading account data fetch these accounts with `fetchAccounts`, shared by all the accounts.

```ts
const accountMetas = await createAccountMetas({
    accounts: { authority, destination, source },
    data: { amount: 1_000_000_000n },
    path: [root, root.program, transfer],
});
```

## Instruction display (clear signing)

Given an IDL enriched with `display` metadata, this package presents a concrete instruction to humans, e.g. to clear sign it. The result carries both presentation modes and lets the renderer choose:

```ts
type InstructionDisplay = {
    // A short imperative label, e.g. "Transfer", derived from the instruction identifier when absent.
    intent: string;
    // The interpolated sentence, e.g. "Transfer 1.5 USDC to Alice", or `null` when it cannot be
    // presented with confidence, in which case the renderer falls back to `fields`.
    interpolatedIntent: string | null;
    // The rows of the fallback list, e.g. [{ label: 'Amount', value: '1.5 USDC' }].
    fields: { label: string; value: string }[];
};
```

### `getInstructionDisplayFromParsedInstruction(root, parsedInstruction, options?)`

Presents an instruction parsed with `parseInstruction` from [`@codama/dynamic-parsers`](../dynamic-parsers/README.md). Values are formatted with the formatters of [`@codama/dynamic-codecs`](../dynamic-codecs/README.md#formatting), whose options it accepts, e.g. `formatAddress` to name addresses or `numberFormat` for a locale.

```ts
import { parseInstruction } from '@codama/dynamic-parsers';
import { getInstructionDisplayFromParsedInstruction } from '@codama/dynamic-instructions';

const parsed = parseInstruction(root, instruction);
const display =
    parsed &&
    getInstructionDisplayFromParsedInstruction(root, parsed, {
        formatAddress: address => names.get(address) ?? address,
    });
// { intent: 'Transfer', interpolatedIntent: 'Transfer 1.5 USDC to Alice', fields: [{ label: 'Amount', value: '1.5 USDC' }, …] }
```

- **Rows:** one per data field, then one per account and remaining account. Optional accounts that are omitted, by leaving them out or by passing the program address, are left out, and remaining accounts are shown even when the IDL declares no groups for them. Labels come from display nodes, or from identifiers in title case. Members skipped `always` are left out, flattened structs are replaced by their prefixed fields, and lists of addresses show one numbered row per address. Other structs, lists and maps show as a single row, e.g. `Config: Fee: 25, Owner: Alice`, and empty values, e.g. an empty list or string, show as `Empty`.
- **Value labels:** a field matching one of its value labels shows the label rather than its formatted value, in its row and in the sentence.
- **Addresses:** every address, in public key fields, account rows, placeholders and address units, goes through the `formatAddress` option.
- **Injected values:** injected values of display nodes, e.g. the `decimals` of an amount, resolve from the `provides` of the instruction and its parents: literal values, accounts, the program, or values of the instruction data.
- **Degraded amounts:** an amount whose decimals cannot be resolved shows its raw value followed by `(raw)`, so it cannot be mistaken for a scaled amount, and makes the sentence `null`. So do placeholders referring to omitted accounts or empty values.

Account data is not read yet, so values read from accounts, e.g. `${accounts.mint.data.decimals}`, cannot be presented, and members skipped `whenInjected` are always shown.
