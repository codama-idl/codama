# Codama ➤ Visitors

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/visitors.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/visitors.svg?style=flat&label=%40codama%2Fvisitors
[npm-url]: https://www.npmjs.com/package/@codama/visitors

This package offers various visitors for Codama IDLs to traverse and manipulate their nodes.

## Installation

```sh
pnpm install @codama/visitors
```

> [!NOTE]
> This package is included in the main [`codama`](../library) package. Meaning, you already have access to its content if you are installing Codama this way.
>
> ```sh
> pnpm install codama
> ```

## Understanding visitors

This package includes and re-exports the [`@codama/visitors-core`](../visitors-core/README.md) package which provides the core interfaces and functions to create and compose visitors.

To get a better understanding of visitors and how they work, please refer to the [`@codama/visitors-core` documentation](../visitors-core/README.md).

In the rest of this documentation, we focus on the high-level visitors that are only available in this package. The main goal of these visitors is to provide a set of specific operations that can be applied to Codama IDLs — as opposed to the generic primitives provided by the core package.

For instance, this package offers visitors that unwrap link nodes, update instructions, add PDAs, set default values, and more.

Let's go through all of them alphabetically.

## Available visitors

### `addPdasVisitor`

This visitor adds `PdaNodes` to the desired `ProgramNodes`. It accepts an object where the keys are the program names and the values are the `PdaNodes` to add within these programs.

```ts
codama.update(
    addPdasVisitor({
        // Add a PDA to the 'token' program.
        token: [
            {
                name: 'associatedToken',
                seeds: [
                    variablePdaSeedNode('mint', publicKeyTypeNode()),
                    constantPdaSeedNode(
                        publicKeyTypeNode(),
                        publicKeyValueNode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                    ),
                    variablePdaSeedNode('owner', publicKeyTypeNode()),
                ],
            },
        ],
        // Add two PDAs to the 'counter' program.
        counter: [
            {
                name: 'counter',
                seeds: [variablePdaSeedNode('authority', publicKeyTypeNode())],
            },
            {
                name: 'counterConfig',
                seeds: [variablePdaSeedNode('counter', publicKeyTypeNode())],
            },
        ],
    }),
);
```

### `createSubInstructionsFromEnumArgsVisitor`

This visitor splits an instruction into multiple sub-instructions by using an enum argument such that each of its variants creates a different sub-instruction. It accepts an object where the keys are the instruction names and the values are the enum argument names that will be used to split the instruction.

```ts
codama.update(
    createSubInstructionsFromEnumArgsVisitor({
        mint: 'mintArgs',
        transfer: 'transferArgs',
        burn: 'burnArgs',
    }),
);
```

### `deduplicateIdenticalDefinedTypesVisitor`

This visitor goes through the `DefinedTypeNodes` of all `ProgramNodes` inside the Codama IDL and removes any duplicates. A `DefinedTypeNode` is considered a duplicate if it has the same name and data structure as another `DefinedTypeNode`. This is useful when you have multiple programs that share the same types.

```ts
codama.update(deduplicateIdenticalDefinedTypesVisitor());
```

### `fillDefaultPdaSeedValuesVisitor`

This visitor fills any missing `PdaSeedValueNodes` from `PdaValueNodes` using the provided `NodePath<InstructionNode>` such that:

- If a `VariablePdaSeedNode` is of type `PublicKeyTypeNode` and the name of the seed matches the name of an account in the `InstructionNode`, then a new `PdaSeedValueNode` will be added with the matching account.
- Otherwise, if a `VariablePdaSeedNode` is of any other type and the name of the seed matches the name of an argument in the `InstructionNode`, then a new `PdaSeedValueNode` will be added with the matching argument.
- Otherwise, no `PdaSeedValueNode` will be added.

It also requires a [`LinkableDictionary`](../visitors-core/README.md#linkable-dictionary) to resolve any link nodes and an optional `strictMode` boolean to throw an error if seeds are still missing after the visitor has run.

Note that this visitor is mainly used for internal purposes.

```ts
codama.update(fillDefaultPdaSeedValuesVisitor(instructionPath, linkables, strictMode));
```

### `flattenInstructionDataArgumentsVisitor`

This visitor flattens any instruction arguments of type `StructTypeNode` such that their fields are no longer nested. This can be useful to simplify the data structure of an instruction.

```ts
codama.update(flattenInstructionDataArgumentsVisitor());
```

### `flattenStructVisitor`

This visitor flattens any struct fields that are also structs such that their fields are no longer nested. It accepts an object such that the keys are the struct names and the values are the field names to flatten or `"*"` to flatten all struct fields.

```ts
codama.update(
    flattenStructVisitor({
        counter: ['data', 'config'],
        escrow: '*',
    }),
);
```

### `getDefinedTypeHistogramVisitor`

This visitor goes through all `DefinedTypeNodes` and outputs a histogram of how many times each type is used in the Codama IDL.

```ts
const histogram = codama.accept(getDefinedTypeHistogramVisitor());
```

The returned histogram is an object such that the keys are the names of visited `DefinedTypeNodes` and the values are objects with properties described below.

```ts
export type DefinedTypeHistogram = {
    [key: CamelCaseString]: {
        // The number of times the type is used as a direct instruction argument.
        directlyAsInstructionArgs: number;
        // The number of times the type is used in account data.
        inAccounts: number;
        // The number of times the type is used in other defined types.
        inDefinedTypes: number;
        // The number of times the type is used in instruction arguments.
        inInstructionArgs: number;
        // The number of times the type is used in total.
        total: number;
    };
};
```

This histogram is used internally in other visitors to understand how types are used before applying transformations.

### `setAccountDiscriminatorFromFieldVisitor`

This visitor helps set account discriminators based on a field in the account data and the value it should take. This is typically used on the very first field of the account data which usually refers to a discriminator value that helps distinguish between multiple accounts in a program.

```ts
codama.update(
    setAccountDiscriminatorFromFieldVisitor({
        counter: { field: 'discriminator', value: k.enumValueNode('accountState', 'counter') },
        escrow: { field: 'discriminator', value: k.enumValueNode('accountState', 'escrow') },
        vault: { field: 'discriminator', value: k.enumValueNode('accountState', 'vault') },
    }),
);
```

### `setFixedAccountSizesVisitor`

This visitor uses the [`getByteSizeVisitor`](../visitors-core/README.md#getbytesizevisitor) to check the size of all `AccountNodes` and, if a fixed-size is identified, it sets the `size` property of the account to that value.

```ts
codama.update(setFixedAccountSizesVisitor());
```

### `setInstructionAccountDefaultValuesVisitor`

This visitor helps set the default values of instruction accounts in bulk. It accepts an array of "rule" objects that must contain the default value to set and the name of the instruction account to set it on. The account name may also be a regular expression to match more complex patterns.

```ts
codama.update(
    setInstructionAccountDefaultValuesVisitor([
        {
            // Set this public key as default value to any account named 'counterProgram'.
            account: 'counterProgram',
            defaultValue: publicKeyValueNode('MyCounterProgram11111111111111111111111111'),
        },
        {
            // Set this PDA as default value to any account named 'associatedToken' or 'ata'.
            account: /^(associatedToken|ata)$/,
            defaultValue: pdaValueNode('associatedToken'),
        },
    ]),
);
```

### `setInstructionDiscriminatorsVisitor`

This visitor adds a new instruction argument to each of the provided instruction names. The new argument is added before any existing argument and marked as a discriminator of the instruction. This is useful if your Codama IDL is missing discriminators in the instruction data.

```ts
codama.update(
    setInstructionDiscriminatorsVisitor({
        mint: { name: 'discriminator', type: numberTypeNode('u8'), value: numberValueNode(0) },
        transfer: { name: 'discriminator', type: numberTypeNode('u8'), value: numberValueNode(1) },
        burn: { name: 'discriminator', type: numberTypeNode('u8'), value: numberValueNode(2) },
    }),
);
```

### `setNumberWrappersVisitor`

This visitor helps wrap `NumberTypeNodes` matching a given name with a specific number wrapper.

```ts
codama.update(
    setNumberWrappersVisitor({
        lamports: { kind: 'SolAmount' },
        timestamp: { kind: 'DateTime' },
        percent: { decimals: 2, kind: 'Amount', unit: '%' },
    }),
);
```

### `setStructDefaultValuesVisitor`

This visitor sets default values for all provided fields of a struct. It accepts an object where the keys are the struct names and the values are objects that map field names to their new default values.

```ts
codama.update(
    setStructDefaultValuesVisitor({
        person: {
            age: numberValueNode(42),
            dateOfBirth: noneValueNode(),
        },
        counter: {
            count: numberValueNode(0),
        },
    }),
);
```

### `transformDefinedTypesIntoAccountsVisitor`

This visitor transforms `DefinedTypeNodes` matching the provided names into `AccountNodes` within the same `ProgramNode`.

```ts
codama.update(transformDefinedTypesIntoAccountsVisitor(['counter', 'escrow']));
```

### `transformU8ArraysToBytesVisitor`

This visitor transforms any fixed-size array of `u8` numbers into a fixed-size `BytesTypeNode`.

```ts
codama.update(transformU8ArraysToBytesVisitor());
```

### `unwrapDefinedTypesVisitor`

This visitor replaces any `DefinedTypeLinkNode` with the actual `DefinedTypeNode` it points to. By default, it unwraps all defined types, but you can provide an array of names to only unwrap specific types.

Note that if multiple link nodes point to the same defined type, each link node will be replaced by a copy of the defined type.

```ts
codama.update(unwrapDefinedTypesVisitor(['counter', 'escrow']));
```

### `unwrapInstructionArgsDefinedTypesVisitor`

This visitor replaces `DefinedTypeLinkNodes` used only once inside an instruction argument with the actual `DefinedTypeNodes` they refer to.

```ts
codama.update(unwrapInstructionArgsDefinedTypesVisitor());
```

### `unwrapTupleEnumWithSingleStructVisitor`

This visitor transforms `EnumTupleVariantTypeNodes` with a single `StructTypeNode` item into `EnumStructVariantTypeNodes`. By default, it will unwrap all tuple variants matching that criteria, but you can provide an array of names to only unwrap specific variants.

```ts
codama.update(unwrapTupleEnumWithSingleStructVisitor());
```

### `unwrapTypeDefinedLinksVisitor`

This visitor replaces any `DefinedTypeLinkNode` matching the provided `NodeSelectors` with the actual `DefinedTypeNode` it points to.

Contrary to the `unwrapDefinedTypesVisitor` though, it only replaces the requested `DefinedTypeLinkNodes` and does not remove the associated `DefinedTypeNode` from its `ProgramNode`.

```ts
codama.update(unwrapTypeDefinedLinksVisitor(['[accountNode]counter.data', '[instructionNode]transfer.config']));
```

### `updateAccountsVisitor`

This visitor allows us to update various aspects of `AccountNodes` and/or delete them. It accepts an object where the keys are the account names and the values are the operations to apply to these accounts.

```ts
codama.update(
    updateAccountsVisitor({
        vault: {
            // Rename the 'vault' account to 'safe'.
            name: 'safe',
            // Rename the 'owner' field to 'authority'.
            data: { owner: 'authority' },
            // Create a new PDA node and link it to this account.
            seeds: [variablePdaSeedNode('authority', publicKeyTypeNode())],
        },
        counter: {
            // Delete the 'counter' account.
            delete: true,
        },
    }),
);
```

### `updateDefinedTypesVisitor`

This visitor allows us to update various aspects of `DefinedTypeNode` and/or delete them. It accepts an object where the keys are the defined type names and the values are the operations to apply to these types.

```ts
codama.update(
    updateDefinedTypesVisitor({
        options: {
            // Rename the 'options' type to 'configs'.
            name: 'configs',
            // Rename the 'sol' field to 'lamports'.
            data: { sol: 'lamports' },
        },
        player: {
            // Delete the 'player' type.
            delete: true,
        },
    }),
);
```

### `updateErrorsVisitor`

This visitor allows us to update various aspects of `ErrorNodes` and/or delete them. It accepts an object where the keys are the error names and the values are the operations to apply to these errors.

```ts
codama.update(
    updateErrorsVisitor({
        invalidPda: {
            // Rename the 'invalidPda' error to 'invalidProgramDerivedAddress'.
            name: 'invalidProgramDerivedAddress',
            // Change the error message.
            message: 'The program-derived address is invalid.',
            // Change the error code.
            code: 123,
        },
        accountMismatch: {
            // Delete the 'accountMismatch' error.
            delete: true,
        },
    }),
);
```

### `updateInstructionsVisitor`

This visitor allows us to update various aspects of `InstructionNodes` and/or delete them. It accepts an object where the keys are the instruction names and the values are the operations to apply to these instructions.

```ts
codama.update(
    updateInstructionsVisitor({
        send: {
            // Rename the 'send' instruction to 'transfer'.
            name: 'transfer',
            accounts: {
                // Rename the 'owner' instruction account to 'authority'.
                owner: { name: 'authority' },
                // Set a default value for the 'associatedToken' instruction account.
                associatedToken: { defaultValue: pdaValueNode('associatedToken') },
                // Update the signer status of the 'payer' instruction account to `true`.
                payer: { isSigner: true },
                // Mark the 'mint' instruction account as optional.
                mint: { isOptional: true },
            },
            arguments: {
                // Set a default value for the 'amount' instruction argument to 1.
                amount: { defaultValue: numberValueNode(1) },
                // Rename the 'decimals' instruction argument to 'mintDecimals'.
                decimals: { name: 'mintDecimals' },
            },
        },
        burn: {
            // Delete the 'burn' instruction.
            delete: true,
        },
    }),
);
```

### `updateProgramsVisitor`

This visitor allows us to update various aspects of `ProgramNodes` and/or delete them. It accepts an object where the keys are the program names and the values are the operations to apply to these programs.

```ts
codama.update(
    updateProgramsVisitor({
        splToken: {
            // Rename the 'splToken' program to 'token'.
            name: 'token',
            // Change the program version.
            version: '3.0.0',
            // Change the program's public key.
            publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
        splAssociatedToken: {
            // Delete the 'splAssociatedToken' program.
            delete: true,
        },
    }),
);
```
