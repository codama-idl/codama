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

This visitor adds `PdaNodes` to the desired `ProgramNodes`. It accepts an object where the keys are the program identifiers (matched exactly) and the values are the `PdaNodes` to add within these programs. It throws if a new PDA shares a camelCase form with another PDA of the same program, since they would collide under the spec's casing-collision rule.

```ts
codama.update(
    addPdasVisitor({
        // Add a PDA to the 'token' program.
        token: [
            {
                identifier: 'associatedToken',
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
                identifier: 'counter',
                seeds: [variablePdaSeedNode('authority', publicKeyTypeNode())],
            },
            {
                identifier: 'counterConfig',
                seeds: [variablePdaSeedNode('counter', publicKeyTypeNode())],
            },
        ],
    }),
);
```

### `checkCodamaVersionVisitor`

This visitor checks that the version of the visited Codama IDL shares its major with the Codama spec version supported by the installed packages — mirroring the check performed by `createFromRoot` — and throws a `CODAMA_ERROR__VERSION_MISMATCH` error otherwise. The IDL is returned unchanged when the check passes.

It is mainly useful at IDL-ingestion boundaries that bypass `createFromRoot`, such as the [Codama CLI](../cli) which otherwise accepts IDLs verbatim without any version checking. For instance, it can be used as a `before` visitor to fail fast on incompatible IDLs:

```json
{
    "idl": "program/idl.json",
    "before": ["@codama/visitors#checkCodamaVersionVisitor"]
}
```

Note that older IDLs can be upgraded instead of rejected by using the [`@codama/upgrade`](../upgrade) package as a `before` visitor.

### `createSubInstructionsFromEnumDataVisitor`

This visitor splits an instruction into multiple sub-instructions by using an enum field of its data such that each of its variants creates a different sub-instruction. It accepts an object where the keys are the instruction names and the values are the identifiers of the enum data fields that will be used to split the instruction.

Each sub-instruction is named `${instruction}_${variant}`. In it, the enum field is replaced by a `${instruction}_${variant}_discriminator` field (using the enum's `size` and defaulting to the variant's discriminator) followed by the variant's payload, whose fields are inlined when it is a struct.

```ts
codama.update(
    createSubInstructionsFromEnumDataVisitor({
        mint: 'mintArgs',
        transfer: 'transferArgs',
        burn: 'burnArgs',
    }),
);
```

### `deduplicateIdenticalDefinedTypesVisitor`

This visitor goes through the `DefinedTypeNodes` of all `ProgramNodes` inside the Codama IDL and removes any duplicates, keeping the copy from the first program and repointing links to the removed copies at it. A `DefinedTypeNode` is considered a duplicate if it has the same identifier and data structure (ignoring docs) as another `DefinedTypeNode`, and if every defined type it links to without an explicit program is itself deduplicated across the same programs. This is useful when you have multiple programs that share the same types.

```ts
codama.update(deduplicateIdenticalDefinedTypesVisitor());
```

### `fillDefaultPdaSeedValuesVisitor`

This visitor fills any missing `PdaSeedValueNodes` from `PdaValueNodes` using the provided `NodePath<InstructionNode>` such that:

- If a `VariablePdaSeedNode` is of type `PublicKeyTypeNode` and its identifier matches the identifier of an account in the `InstructionNode`, then a new `PdaSeedValueNode` will be added with an `AccountValueNode` pointing to that account.
- Otherwise, if its identifier matches a top-level field of the instruction's `data` (following defined type links), then a new `PdaSeedValueNode` will be added with a `DataValueNode` pointing to that field.
- Otherwise, no `PdaSeedValueNode` will be added.

It also requires a [`LinkableDictionary`](../visitors-core/README.md#linkable-dictionary) to resolve any link nodes and an optional `strictMode` boolean to throw an error if seeds are still missing after the visitor has run.

Note that this visitor is mainly used for internal purposes.

```ts
codama.update(fillDefaultPdaSeedValuesVisitor(instructionPath, linkables, strictMode));
```

### `flattenInstructionDataVisitor`

This visitor flattens the fields of type `StructTypeNode` inside the `data` of every instruction such that their fields are no longer nested. This can be useful to simplify the data structure of an instruction. Linked data is left untouched since the defined type may be shared; use `unwrapInstructionDataDefinedTypesVisitor` first to flatten it.

```ts
codama.update(flattenInstructionDataVisitor());
```

### `flattenStructVisitor`

This visitor flattens any struct fields that are also structs such that their fields are no longer nested. It accepts an object such that the keys are the struct names and the values are the field identifiers to flatten (matched exactly) or `"*"` to flatten all struct fields.

Structs carrying `transforms` are not inlined, since that would change their wire format. Flattening throws if a struct to inline carries `plugins`, since they would be lost, or if two resulting fields share a camelCase form.

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

The returned histogram is an object such that the keys are the identifiers of the linked `DefinedTypeNodes`, prefixed by the identifier of their program, and the values are objects with properties described below.

```ts
export type DefinedTypeHistogram = {
    [key: IdentifierString | `${IdentifierString}.${IdentifierString}`]: {
        // The number of times the type is used as an instruction's data or as the type of one of its top-level data fields.
        directlyAsInstructionData: number;
        // The number of times the type is used in account data.
        inAccounts: number;
        // The number of times the type is used in other defined types.
        inDefinedTypes: number;
        // The number of times the type is used in event payloads.
        inEvents: number;
        // The number of times the type is used in instruction data.
        inInstructionData: number;
        // The number of times the type is used in total, including default values, PDA seeds and constants.
        total: number;
    };
};
```

This histogram is used internally in other visitors to understand how types are used before applying transformations.

### `setAccountDiscriminatorFromFieldVisitor`

This visitor helps set account discriminators based on a field in the account data and the value it should take. This is typically used on the very first field of the account data which usually refers to a discriminator value that helps distinguish between multiple accounts in a program. The account data must be an inline `StructTypeNode`, since changing a linked defined type would affect every node that uses it.

```ts
codama.update(
    setAccountDiscriminatorFromFieldVisitor({
        counter: { field: 'discriminator', value: enumValueNode(definedTypeLinkNode('accountState'), 'counter') },
        escrow: { field: 'discriminator', value: enumValueNode(definedTypeLinkNode('accountState'), 'escrow') },
        vault: { field: 'discriminator', value: enumValueNode(definedTypeLinkNode('accountState'), 'vault') },
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

This visitor sets default values for all provided fields of a struct. It accepts an object where the keys select the nodes containing the structs (e.g. defined types, accounts or instructions with inline `data`) and the values are objects that map field identifiers (matched exactly) to their new default values. A `null` value removes the default value of a field.

```ts
codama.update(
    setStructDefaultValuesVisitor({
        person: {
            age: integerValueNode('42'),
            dateOfBirth: noneValueNode(),
        },
        counter: {
            count: { strategy: 'omitted', value: integerValueNode('0') },
        },
    }),
);
```

Contextual default values of instruction data fields, such as the bump of an account, are expressed with an `injectedValueNode` whose key is provided by the instruction's `provides` attribute.

### `transformDefinedTypesIntoAccountsVisitor`

This visitor transforms `DefinedTypeNodes` matching the provided identifiers into `AccountNodes` within the same `ProgramNode`, using the type of each `DefinedTypeNode` as the account data.

```ts
codama.update(transformDefinedTypesIntoAccountsVisitor(['counter', 'escrow']));
```

### `transformU8ArraysToBytesVisitor`

This visitor transforms any fixed-size array of plain `u8` integers into a `BytesTypeNode` with a `FixedSizeTransformNode`. By default, it transforms arrays of any size, but you can provide an array of sizes to only transform specific ones.

```ts
codama.update(transformU8ArraysToBytesVisitor([32, 64]));
```

### `unwrapDefinedTypesVisitor`

This visitor replaces any `DefinedTypeLinkNode` with the type of the `DefinedTypeNode` it points to and removes the inlined `DefinedTypeNodes` from their programs. By default, it unwraps all defined types, but you can provide an array of identifiers, optionally prefixed by a program identifier, to only unwrap specific types.

Note that if multiple link nodes point to the same defined type, each link node will be replaced by a copy of the defined type. The `transforms` of each link are applied on top of the inlined type.

```ts
codama.update(unwrapDefinedTypesVisitor(['counter', 'splToken.escrow']));
```

### `unwrapInstructionDataDefinedTypesVisitor`

This visitor inlines the `DefinedTypeNodes` that are used exactly once in the Codama IDL, either as the `data` of an instruction or as the type of one of its top-level data fields. Enums are kept as defined types.

```ts
codama.update(unwrapInstructionDataDefinedTypesVisitor());
```

### `unwrapTupleEnumWithSingleStructVisitor`

This visitor transforms `EnumVariantTypeNodes` whose data is a `TupleTypeNode` with a single `StructTypeNode` item (or a link to one) such that their data becomes the struct itself. By default, it will unwrap all variants matching that criteria, but you can provide an array of `NodeSelectors` to only unwrap specific variants. Linked defined types that are no longer used afterwards are removed.

```ts
codama.update(unwrapTupleEnumWithSingleStructVisitor());
```

### `unwrapTypeDefinedLinksVisitor`

This visitor replaces any `DefinedTypeLinkNode` matching the provided `NodeSelectors` with the type of the `DefinedTypeNode` it points to, applying the `transforms` of the link on top of it.

Contrary to the `unwrapDefinedTypesVisitor` though, it only replaces the requested `DefinedTypeLinkNodes` and does not remove the associated `DefinedTypeNode` from its `ProgramNode`.

```ts
codama.update(unwrapTypeDefinedLinksVisitor(['[accountNode]counter.data', '[instructionNode]transfer.config']));
```

### `updateAccountsVisitor`

This visitor allows us to update various aspects of `AccountNodes` and/or delete them. It accepts an object where the keys are the account identifiers (matched exactly, optionally prefixed by a program identifier) and the values are the operations to apply to these accounts. Unknown update keys, such as the `name` key of Codama v1, throw an error rather than being silently ignored.

Renames are propagated to every reference: renaming an account renames the `AccountLinkNodes` pointing to it, as well as the `PdaNode` of the same program sharing its identifier and its `PdaLinkNodes`. Renaming the fields of its data repoints every path going through them, such as its `FieldDiscriminatorNodes` and the `AccountDataValueNodes` of instruction accounts linked to it.

```ts
codama.update(
    updateAccountsVisitor({
        vault: {
            // Rename the 'vault' account to 'safe'.
            identifier: 'safe',
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

This visitor allows us to update various aspects of `DefinedTypeNode` and/or delete them. It accepts an object where the keys are the defined type identifiers (matched exactly, optionally prefixed by a program identifier) and the values are the operations to apply to these types. Unknown update keys, such as the `name` key of Codama v1, throw an error rather than being silently ignored.

Renames are propagated to every reference: renaming a defined type renames the `DefinedTypeLinkNodes` pointing to it, renaming the fields of a struct type repoints every path going through them (e.g. `DataValueNodes` of instructions whose data links to the type), and renaming the variants of an enum type repoints the `EnumValueNodes` of that type.

```ts
codama.update(
    updateDefinedTypesVisitor({
        options: {
            // Rename the 'options' type to 'configs'.
            identifier: 'configs',
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

This visitor allows us to update various aspects of `ErrorNodes` and/or delete them. It accepts an object where the keys are the error identifiers (matched exactly, optionally prefixed by a program identifier) and the values are the operations to apply to these errors. Unknown update keys, such as the `name` key of Codama v1, throw an error rather than being silently ignored.

```ts
codama.update(
    updateErrorsVisitor({
        invalidPda: {
            // Rename the 'invalidPda' error to 'invalidProgramDerivedAddress'.
            identifier: 'invalidProgramDerivedAddress',
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

This visitor allows us to update various aspects of `InstructionNodes` and/or delete them. It accepts an object where the keys are the instruction identifiers (matched exactly, optionally prefixed by a program identifier) and the values are the operations to apply to these instructions. Unknown update keys, such as the `name` key of Codama v1, throw an error rather than being silently ignored.

- `accounts` updates existing instruction accounts, keyed by identifier. New PDA default values get their missing seeds filled using the `fillDefaultPdaSeedValuesVisitor`.
- `data` updates existing fields of the instruction's inline `data`, keyed by path (e.g. `amount` or `config.fee`). Fields behind a `DefinedTypeLinkNode` cannot be updated since the defined type may be shared; unwrap it first. Default values must be `ValueNodes`: contextual defaults, such as the bump of an account, are expressed with an `InjectedValueNode` and a matching entry in `provides`.
- `provides` is merged by identifier with the instruction's `ProvidedNodes`; a `null` value removes an entry.

Updates from every entry matching an instruction are merged and applied at once, keyed by the original identifiers of its accounts and data fields. Nodes supplied by the updates, such as default values or provided nodes, must use the new identifiers since they refer to the updated instruction. Updating an account or a data field that does not exist throws an error. Renames are propagated to every reference within the instruction: renaming an account repoints the `AccountValueNodes`, `AccountBumpValueNodes`, `AccountDataValueNodes` and `${accounts.…}` placeholders pointing to it, and renaming a data field repoints the `DataValueNodes`, `FieldDiscriminatorNodes` and `${data.…}` placeholders going through it.

```ts
codama.update(
    updateInstructionsVisitor({
        send: {
            // Rename the 'send' instruction to 'transfer'.
            identifier: 'transfer',
            accounts: {
                // Rename the 'owner' instruction account to 'authority'.
                owner: { identifier: 'authority' },
                // Set a default value for the 'associatedToken' instruction account.
                associatedToken: { defaultValue: pdaValueNode('associatedToken') },
                // Update the signer status of the 'payer' instruction account to `true`.
                payer: { isSigner: true },
                // Mark the 'mint' instruction account as optional.
                mint: { isOptional: true },
            },
            data: {
                // Set a default value for the 'amount' data field to 1.
                amount: { defaultValue: integerValueNode('1') },
                // Rename the nested 'config.decimals' data field to 'mintDecimals'.
                'config.decimals': { identifier: 'mintDecimals' },
                // Default the 'bump' data field to the bump of the 'associatedToken' account.
                bump: { defaultValue: injectedValueNode({ key: 'bump' }) },
            },
            provides: { bump: accountBumpValueNode('associatedToken') },
        },
        burn: {
            // Delete the 'burn' instruction.
            delete: true,
        },
    }),
);
```

### `updateProgramsVisitor`

This visitor allows us to update various aspects of `ProgramNodes` and/or delete them. It accepts an object where the keys are the program identifiers (matched exactly) and the values are the operations to apply to these programs. Unknown update keys, such as the `name` key of Codama v1, throw an error rather than being silently ignored. Renaming a program renames every `ProgramLinkNode` pointing to it.

```ts
codama.update(
    updateProgramsVisitor({
        splToken: {
            // Rename the 'splToken' program to 'token'.
            identifier: 'token',
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
