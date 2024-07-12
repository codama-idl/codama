# Kinobi ➤ Visitors

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/visitors.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/visitors.svg?style=flat&label=%40kinobi-so%2Fvisitors
[npm-url]: https://www.npmjs.com/package/@kinobi-so/visitors

This package offers various visitors for Kinobi IDLs to traverse and manipulate their nodes.

## Installation

```sh
pnpm install @kinobi-so/visitors
```

> [!NOTE]
> This package is included in the main [`kinobi`](../library) package. Meaning, you already have access to its content if you are installing Kinobi this way.
>
> ```sh
> pnpm install kinobi
> ```

## Understanding visitors

This package includes and re-exports the [`@kinobi-so/visitors-core`](../visitors-core/README.md) package which provides the core interfaces and functions to create and compose visitors.

To get a better understanding of visitors and how they work, please refer to the [`@kinobi-so/visitors-core` documentation](../visitors-core/README.md).

In the rest of this documentation, we focus on the high-level visitors that are only available in this package. The main goal of these visitors is to provide a set of specific operations that can be applied to Kinobi IDLs — as opposed to the generic primitives provided by the core package.

For instance, this package provides visitors to unwrap link nodes, update instructions, add PDAs, set default values, and more.

Let's go through all of them alphabetically.

## Available visitors

### `addPdasVisitor`

This visitor adds `PdaNodes` to the desired `ProgramNodes`. It accepts an object where the keys are the program names and the values are the `PdaNodes` to add within these programs.

```ts
kinobi.update(
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
kinobi.update(
    createSubInstructionsFromEnumArgsVisitor({
        mint: 'mintArgs',
        transfer: 'transferArgs',
        burn: 'burnArgs',
    }),
);
```

### `deduplicateIdenticalDefinedTypesVisitor`

This visitor goes through the `DefinedTypeNodes` of all `ProgramNodes` inside the Kinobi IDL and remove any duplicates. A `DefinedTypeNode` is considered a duplicate if it has the same name and data structure as another `DefinedTypeNode`. This is useful when you have multiple programs that share the same types.

```ts
kinobi.update(deduplicateIdenticalDefinedTypesVisitor());
```

### `fillDefaultPdaSeedValuesVisitor`

This visitor fills any missing `PdaSeedValueNodes` from `PdaValueNodes` using the provided `InstructionNode` such that:

-   If a `VariablePdaSeedNode` is of type `PublicKeyTypeNode` and the name of the seed matches the name of an account in the `InstructionNode`, then a new `PdaSeedValueNode` will be added with the matching account.
-   Otherwise, if a `VariablePdaSeedNode` is of any other type and the name of the seed matches the name of an argument in the `InstructionNode`, then a new `PdaSeedValueNode` will be added with the matching argument.
-   Otherwise, no `PdaSeedValueNode` will be added.

It also requires a [`LinkableDictionary`](../visitors-core/README.md#linkable-dictionary) to resolve any link nodes and an optional `strictMode` boolean to throw an error if seeds are still missing after the visitor has run.

Note that this visitor is mainly used for internal purposes.

```ts
kinobi.update(fillDefaultPdaSeedValuesVisitor(instructionNode, linkables, strictMode));
```

### `flattenInstructionDataArgumentsVisitor`

This visitor flattens any instruction arguments of type `StructTypeNode` such that their fields are no longer nested. This can be useful to simplify the data structure of an instruction.

```ts
kinobi.update(flattenInstructionDataArgumentsVisitor());
```

### `flattenStructVisitor`

This visitor flattens any struct fields that are also structs such that their fields are no longer nested. It accepts an object such that the keys are the struct names and the values are the field names to flatten or `"*"` to flatten all struct fields.

```ts
kinobi.update(
    flattenStructVisitor({
        counter: ['data', 'config'],
        escrow: '*',
    }),
);
```

### `getDefinedTypeHistogramVisitor`

This visitor go through all `DefinedTypeNodes` and outputs a histogram of how many times each type is used in the Kinobi IDL.

```ts
const histogram = kinobi.accept(getDefinedTypeHistogramVisitor());
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

This visitor helps to set account discriminator based on a field in the account data and the value it should take. This is typically used on the very first field of the account data which usually refers to a discriminator value that helps distinguish between multiple accounts in a program.

```ts
kinobi.update(
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
kinobi.update(setFixedAccountSizesVisitor());
```

### `setInstructionAccountDefaultValuesVisitor`

This visitor helps set the default values of instruction accounts in bulk. It accepts an array of "rule" objects that must contain the default value to set and the name of the instruction account to set it on. The account name may also be a regular expression to match more complex patterns.

```ts
kinobi.update(
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

This visitor adds a new instruction argument to each of the provided instruction names. The new argument is added before any existing argument and marked as a discriminator of the instruction. This is useful if your Kinobi IDL is missing discriminators in the instruction data.

```ts
kinobi.update(
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
kinobi.update(
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
kinobi.update(
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
kinobi.update(transformDefinedTypesIntoAccountsVisitor(['counter', 'escrow']));
```

### `transformU8ArraysToBytesVisitor`

This visitor transforms fixed-size array of `u8` numbers into fixed-size `BytesTypeNode`.

```ts
kinobi.update(transformU8ArraysToBytesVisitor());
```

### `unwrapDefinedTypesVisitor`

This visitor replaces any `DefinedTypeLinkNode` with the actual `DefinedTypeNode` it points to. By default, it unwraps all defined types, but you can provide an array of names to only unwrap specific types.

Note that if multiple link nodes point to the same defined type, each link node will be replaced by a copy of the defined type.

```ts
kinobi.update(unwrapDefinedTypesVisitor(['counter', 'escrow']));
```

### `unwrapInstructionArgsDefinedTypesVisitor`

This visitor replaces `DefinedTypeLinkNodes` used only once inside an instruction argument with the actual `DefinedTypeNodes` they refer to.

```ts
kinobi.update(unwrapInstructionArgsDefinedTypesVisitor());
```

### `unwrapTupleEnumWithSingleStructVisitor`

This visitor transform `EnumTupleVariantTypeNodes` with a single `StructTypeNode` item into `EnumStructVariantTypeNodes`. By default, it will unwrap all tuple variant matching that criteria, but you can provide an array of names to only unwrap specific variants.

```ts
kinobi.update(unwrapTupleEnumWithSingleStructVisitor());
```

### `unwrapTypeDefinedLinksVisitor`

This visitor replaces any `DefinedTypeLinkNode` matching the provided `NodeSelectors` with the actual `DefinedTypeNode` it points to.

Contrary to the `unwrapDefinedTypesVisitor` though, it only replaces the requested `DefinedTypeLinkNodes` and does not remove the associated `DefinedTypeNode` from its `ProgramNode`.

```ts
kinobi.update(unwrapTypeDefinedLinksVisitor(['[accountNode]counter.data', '[instructionNode]transfer.config']));
```

### `updateAccountsVisitor`

TODO

```ts
kinobi.update(updateAccountsVisitor());
```

### `updateDefinedTypesVisitor`

TODO

```ts
kinobi.update(updateDefinedTypesVisitor());
```

### `updateErrorsVisitor`

TODO

```ts
kinobi.update(updateErrorsVisitor());
```

### `updateInstructionsVisitor`

TODO

```ts
kinobi.update(updateInstructionsVisitor());
```

### `updateProgramsVisitor`

TODO

```ts
kinobi.update(updateProgramsVisitor());
```
