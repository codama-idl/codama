# Codama ➤ Dynamic Client

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/dynamic-client.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/dynamic-client.svg?style=flat&label=%40codama%2Fdynamic-client
[npm-url]: https://www.npmjs.com/package/@codama/dynamic-client

This package provides a runtime Solana program client to dynamically interact with Solana programs using Codama IDLs, with optional TypeScript type generation for full type safety. It contains PDA derivation, and an instruction builder powered by [@codama/dynamic-instructions](../dynamic-instructions/README.md).

## Installation

```sh
pnpm install @codama/dynamic-client
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Quick Start

### Untyped

```ts
import { createProgramClient } from '@codama/dynamic-client';
import idl from './my-program-idl.json';

const client = createProgramClient(idl);

const instruction = await client.methods
    .transferSol({ amount: 1_000_000_000 })
    .accounts({ source: senderAddress, destination: receiverAddress })
    .instruction();
```

### Typed with generated types

```ts
import { createProgramClient } from '@codama/dynamic-client';
import type { MyProgramClient } from './generated/my-program-types';
import idl from './my-program-idl.json';

const client = createProgramClient<MyProgramClient>(idl);
// client.methods, their data and .accounts() are now fully typed
```

## API Reference

### `createProgramClient<T>(idl, options?)`

Creates a program client from a Codama IDL of the latest major. IDLs of older majors (e.g. v1) throw `CODAMA_ERROR__VERSION_MISMATCH`, so upgrade them first with [`@codama/upgrade`](../upgrade):

```ts
import { upgrade } from '@codama/upgrade';

const client = createProgramClient(upgrade(v1Idl));
```

| Parameter           | Type               | Description                               |
| ------------------- | ------------------ | ----------------------------------------- |
| `idl`               | `object \| string` | Codama IDL object or JSON string          |
| `options.programId` | `AddressInput`     | Override the program address from the IDL |

Returns a `ProgramClient` (or `T` when a type parameter is provided).

### `ProgramClient`

```ts
type ProgramClient = {
    instructions: Map<string, InstructionNode>;
    methods: Record<string, (data?: DataInput) => ProgramMethodBuilder>;
    pdas?: Record<string, (seeds?: Record<string, unknown>, options?: PdaOptions) => Promise<ProgramDerivedAddress>>;
    programAddress: Address;
    root: RootNode;
};
```

### `ProgramMethodBuilder` (fluent API)

```ts
client.methods
    .myInstruction(data) // provide the instruction data
    .accounts(accounts) // provide account addresses, including remaining accounts
    .signers(['accountName']) // optionally mark ambiguous accounts as signers
    .instruction(); // Promise<Instruction>
```

### `AddressInput`

Accepts any of:

- `Address` (from `@solana/addresses`)
- Legacy `PublicKey` (any object with `.toBase58()`)
- Base58 string

## Accounts

Accounts with a `defaultValue` in the IDL (PDAs, program ids, constants) are resolved automatically and may be omitted from `.accounts()`.

### Automatic resolution rules

For the full table of automatic resolution rules, see [`@codama/dynamic-address-resolution`](../dynamic-address-resolution/README.md#automatic-resolution-rules).

### Optional accounts

Pass `null` for optional accounts to be resolved according to `optionalAccountStrategy` (either will be `omitted` or replaced on `programId`):

```ts
.accounts({
    authority,
    program: programAddress,
    programData: null,  // optional - resolved via optionalAccountStrategy
})
```

### Ambiguous signers

When an account has `isSigner: 'either'` in the IDL, use `.signers()` to explicitly mark it:

```ts
.accounts({ owner: ownerAddress })
.signers(['owner'])
```

### Remaining accounts

Remaining accounts are provided in `.accounts()` as lists of addresses, under the name of their `remainingAccountsNode`:

```ts
.accounts({ delegate, owner: multisig, source, multiSigners: [signer1, signer2] })
```

### Resolved inputs

Accounts and data fields resolved by custom code, i.e. those carrying a `codama.resolver` plugin, have no default value the client can compute. Provide them like any other input (or `null` when they are optional accounts):

```ts
client.methods
    .create({ createArgs })
    .accounts({ authority, masterEdition: null, mint, payer, splTokenProgram: TOKEN_PROGRAM_ADDRESS })
    .instruction();
```

## PDA Derivation

### Standalone

```ts
const [address, bump] = await client.pdas.canonical({
    program: programAddress,
    seed: 'idl',
});
```

PDAs are derived from the `programId` of the PDA, or else the program defining it. Instructions may derive a PDA from another program (`pdaValueNode.programId`); pass that program as `programId` to derive it the same way:

```ts
const [ata] = await client.pdas.associatedToken({ mint, owner, tokenProgram }, { programId: ATA_PROGRAM_ADDRESS });
```

### Auto-derived in instructions

Accounts with `pdaValueNode` defaults are resolved automatically. Seeds are pulled from other accounts and data fields of the instruction:

```ts
// metadata PDA is auto-derived from program + seed
const ix = await client.methods
    .initialize({ seed: 'idl', data: myData /* ... */ })
    .accounts({ authority, program: programAddress, programData })
    .instruction();
```

Nested/dependent PDAs (where one PDA seed references another PDA) are resolved recursively.

## Data

The instruction data is provided as the value of its `data` type node, e.g. an object keyed by field identifier for a `structTypeNode`. Fields with `defaultValueStrategy: 'omitted'` (e.g. discriminators) are encoded automatically and should not be provided.

## Error Handling

All errors are instances of `CodamaError` from `@codama/errors`:

```ts
import { CodamaError, isCodamaError, CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING } from '@codama/dynamic-client';

try {
    const ix = await client.methods.transferSol({ amount: 100 }).accounts({}).instruction();
} catch (err) {
    if (isCodamaError(err, CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING)) {
        console.error(`Missing account: ${err.context.accountName}`);
    }
}
```

## CLI

The package includes a CLI for generating TypeScript types from Codama IDL files of the latest major.

```sh
npx @codama/dynamic-client generate-client-types <codama-idl.json> <output-dir>
```

Example:

```sh
npx @codama/dynamic-client generate-client-types ./idl/codama.json ./generated
```

This reads the IDL file and writes a `*-types.ts` file to the output directory containing strongly-typed interfaces for all instruction data, accounts, PDAs, and the program client.

### `generateClientTypes(idl)`

The same is available as a TypeScript function:

```ts
import { generateClientTypes } from '@codama/dynamic-client';
import type { RootNode } from 'codama';
import { readFileSync, writeFileSync } from 'node:fs';

const idl: RootNode = JSON.parse(readFileSync('./my-program-idl.json', 'utf-8'));
const typesSource = generateClientTypes(idl);
writeFileSync('./generated/my-program-idl-types.ts', typesSource);
```

## Utilities

```ts
import { toAddress, isPublicKeyLike } from '@codama/dynamic-client';

// Convert any AddressInput to Address
const addr = toAddress('11111111111111111111111111111111');
const addr2 = toAddress(new PublicKey('...'));

// Type guard for legacy PublicKey objects
if (isPublicKeyLike(value)) {
    const addr = toAddress(value);
}
```
