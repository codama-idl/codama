# Codama ➤ Dynamic Instructions

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/dynamic-instructions.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/dynamic-instructions.svg?style=flat&label=%40codama%2Fdynamic-instructions
[npm-url]: https://www.npmjs.com/package/@codama/dynamic-instructions

This package provides a runtime Solana instruction builder that dynamically constructs `Instruction` (`@solana/instructions`) from Codama IDL and provides type generation for full TypeScript type safety.

## Installation

```sh
pnpm install @codama/dynamic-instructions
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Quick Start

### Untyped

```ts
import { createProgramClient } from '@codama/dynamic-instructions';
import idl from './my-program-idl.json';

const client = createProgramClient(idl);

const instruction = await client.methods
    .transferSol({ amount: 1_000_000_000 })
    .accounts({ source: senderAddress, destination: receiverAddress })
    .instruction();
```

### Typed with generated types

```ts
import { createProgramClient } from '@codama/dynamic-instructions';
import type { MyProgramClient } from './generated/my-program-types';
import idl from './my-program-idl.json';

const client = createProgramClient<MyProgramClient>(idl);
// client.methods, .accounts(), args are now fully typed
```

## API Reference

### `createProgramClient<T>(idl, options?)`

Creates a program client from a Codama IDL.

| Parameter           | Type               | Description                               |
| ------------------- | ------------------ | ----------------------------------------- |
| `idl`               | `object \| string` | Codama IDL object or JSON string          |
| `options.programId` | `AddressInput`     | Override the program address from the IDL |

Returns a `ProgramClient` (or `T` when a type parameter is provided).

### `ProgramClient`

```ts
type InstructionName = CamelCaseString;
type AccountName = CamelCaseString;

type ProgramClient = {
    methods: Record<InstructionName, (args?) => ProgramMethodBuilder>;
    pdas?: Record<AccountName, (seeds?) => Promise<ProgramDerivedAddress>>;
    programAddress: Address;
    instructions: Map<InstructionName, InstructionNode>;
    root: RootNode;
};
```

### `ProgramMethodBuilder` (fluent API)

```ts
client.methods
    .myInstruction(args) // provide instruction arguments
    .accounts(accounts) // provide account addresses
    .signers(['accountName']) // optionally mark ambiguous accounts as signers
    .resolvers({ customResolver: async (argumentsInput, accountsInput) => {} }) // optionally provide custom resolver according to resolverValueNode in IDL
    .instruction(); // Promise<Instruction>
```

### `AddressInput`

Accepts any of:

- `Address` (from `@solana/addresses`)
- Legacy `PublicKey` (any object with `.toBase58()`)
- Base58 string

## Accounts

### Automatic resolution rules

Accounts (pda, program ids) with `defaultValue` are resolved automatically, hence can be omitted.

| Account scenario                                                | Type in `.accounts()`          | Auto resolution                                                                              |
| --------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| Required account without `defaultValue`                         | `{ system: Address }`          | No                                                                                           |
| Required account with `defaultValue`<br>(PDA, programId, etc.)  | `{ system?: Address }`         | Auto-resolved to `defaultValue` if omitted                                                   |
| Optional account (`isOptional: true`)<br>without `defaultValue` | `{ system: Address \| null }`  | Resolved via `optionalAccountStrategy`,<br>if provided as `null`                             |
| Optional account (`isOptional: true`)<br>with `defaultValue`    | `{ system?: Address \| null }` | - `null` resolves via `optionalAccountStrategy`<br>- `undefined` resolves via `defaultValue` |

### Auto-resolved account addresses

Accounts with `defaultValue` in the IDL are automatically resolved when omitted from `.accounts()`. This includes:

- **PDA accounts** — derived from seeds defined in the IDL
- **Program IDs** — resolved to known program addresses (e.g., System Program, Token Program)
- **Constants** — resolved from constant value nodes

You can always override auto-derived accounts by providing an explicit address.

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

### Custom resolvers

When an account or argument is `resolverValueNode` in the IDL, provide a custom resolver function `.resolvers({ [resolverName]: async fn })` to help with account/arguments resolution:

```ts
client.methods
    .create({ tokenStandard: 'NonFungible' })
    .accounts({ owner: ownerAddress })
    .resolvers({
        resolveIsNonFungible: async (argumentsInput, accountsInput) => {
            return argumentsInput.tokenStandard === 'NonFungible';
        },
    });
```

## PDA Derivation

### Standalone

```ts
const [address, bump] = await client.pdas.canonical({
    program: programAddress,
    seed: 'idl',
});
```

### Auto-derived in instructions

Accounts with `pdaValueNode` defaults are resolved automatically. Seeds are pulled from other accounts and arguments in the instruction:

```ts
// metadata PDA is auto-derived from program + seed
const ix = await client.methods
    .initialize({ seed: 'idl', data: myData /* ... */ })
    .accounts({ authority, program: programAddress, programData })
    .instruction();
```

Nested/dependent PDAs (where one PDA seed references another PDA) are resolved recursively.

## Arguments

Arguments with `defaultValueStrategy: 'omitted'` (e.g., discriminators) are auto-encoded and should not be provided.

## Error Handling

All errors are instances of `CodamaError` from `@codama/errors`:

```ts
import {
    CodamaError,
    isCodamaError,
    CODAMA_ERROR__DYNAMIC_INSTRUCTIONS__ACCOUNT_MISSING,
} from '@codama/dynamic-instructions';

try {
    const ix = await client.methods.transferSol({ amount: 100 }).accounts({}).instruction();
} catch (err) {
    if (isCodamaError(err, CODAMA_ERROR__DYNAMIC_INSTRUCTIONS__ACCOUNT_MISSING)) {
        console.error(`Missing account: ${err.context.accountName}`);
    }
}
```

## CLI

The package includes a CLI for generating TypeScript types from Codama IDL files.

```sh
npx @codama/dynamic-instructions generate-client-types <codama-idl.json> <output-dir>
```

Example:

```sh
npx @codama/dynamic-instructions generate-client-types ./idl/codama.json ./generated
```

This reads the IDL file and writes a `*-types.ts` file to the output directory containing strongly-typed interfaces for all instructions, accounts, arguments, PDAs, and the program client.

### `generateClientTypes(idl)`

The same is available as a TypeScript function:

```ts
import { generateClientTypes } from '@codama/dynamic-instructions';
import type { RootNode } from 'codama';
import { readFileSync, writeFileSync } from 'node:fs';

const idl: RootNode = JSON.parse(readFileSync('./my-program-idl.json', 'utf-8'));
const typesSource = generateClientTypes(idl);
writeFileSync('./generated/my-program-idl-types.ts', typesSource);
```

## Utilities

```ts
import { toAddress, isPublicKeyLike } from '@codama/dynamic-instructions';

// Convert any AddressInput to Address
const addr = toAddress('11111111111111111111111111111111');
const addr2 = toAddress(new PublicKey('...'));

// Type guard for legacy PublicKey objects
if (isPublicKeyLike(value)) {
    const addr = toAddress(value);
}
```
