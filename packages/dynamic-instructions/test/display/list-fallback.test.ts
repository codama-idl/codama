import type { Address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';
import {
    amountNumberDisplayNode,
    argumentValueNode,
    arrayTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    injectedValueNode,
    instructionAccountDisplayNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    instructionRemainingAccountsNode,
    numberTypeNode,
    optionTypeNode,
    publicKeyTypeNode,
    remainderCountNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { listFallback } from '../../src/display/list-fallback';
import { displayContext, mockResolveDefinedType, parsedInstruction } from '../test-utils';

const AUTHORITY = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY' as Address;
const SIGNER_A = '3Wnd5Df69KitZfUoPYZU438eFRNwGHkhLnSAWL65PxJX' as Address;
const SIGNER_B = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' as Address;
const SOURCE_A = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS' as Address;
const SOURCE_B = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy' as Address;

describe('listFallback', () => {
    test('it lists arguments and accounts with derived labels', async () => {
        // Given an instruction with one argument and one account.
        const instruction = instructionNode({
            accounts: [instructionAccountNode({ isSigner: false, isWritable: true, name: 'destination' })],
            arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') })],
            name: 'transfer',
        });

        // When we build the fallback list.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({
                    accounts: [['destination', AUTHORITY]],
                    data: { amount: 42n },
                    instruction,
                }),
            }),
        );

        // Then we expect labelled fields for the argument and the account.
        expect(result).toEqual([
            { label: 'Amount', value: '42' },
            { label: 'Destination', value: AUTHORITY },
        ]);
    });

    test('it honours explicit labels for arguments and accounts', async () => {
        // Given display labels on the argument and account.
        const instruction = instructionNode({
            accounts: [
                instructionAccountNode({
                    display: instructionAccountDisplayNode({ label: 'To' }),
                    isSigner: false,
                    isWritable: true,
                    name: 'destination',
                }),
            ],
            arguments: [
                instructionArgumentNode({
                    display: structFieldDisplayNode({ label: 'Lamports' }),
                    name: 'amount',
                    type: numberTypeNode('u64'),
                }),
            ],
            name: 'transfer',
        });

        // When we build the fallback list.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({
                    accounts: [['destination', AUTHORITY]],
                    data: { amount: 42n },
                    instruction,
                }),
            }),
        );

        // Then we expect the overridden labels.
        expect(result).toEqual([
            { label: 'Lamports', value: '42' },
            { label: 'To', value: AUTHORITY },
        ]);
    });

    test('it skips members marked skip: always', async () => {
        // Given an argument hidden with skip: always.
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    display: structFieldDisplayNode({ skip: 'always' }),
                    name: 'discriminator',
                    type: numberTypeNode('u8'),
                }),
                instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') }),
            ],
            name: 'transfer',
        });

        // When we build the fallback list.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({ data: { amount: 42n, discriminator: 3 }, instruction }),
            }),
        );

        // Then we expect only the visible argument.
        expect(result).toEqual([{ label: 'Amount', value: '42' }]);
    });

    test('it hides whenInjected members whose value was consumed', async () => {
        // Given an argument marked whenInjected whose name is in the consumed set.
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    display: structFieldDisplayNode({ skip: 'whenInjected' }),
                    name: 'decimals',
                    type: numberTypeNode('u8'),
                }),
            ],
            name: 'transfer',
        });

        // When we build the fallback list with that member marked consumed.
        const result = await listFallback(
            displayContext({
                consumedMemberNames: new Set(['decimals']),
                parsedInstruction: parsedInstruction({ data: { decimals: 6 }, instruction }),
            }),
        );

        // Then we expect the whenInjected argument to be hidden.
        expect(result).toEqual([]);
    });

    test('it shows whenInjected members when their value was not consumed', async () => {
        // Given an argument marked whenInjected that is not in the consumed set.
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    display: structFieldDisplayNode({ skip: 'whenInjected' }),
                    name: 'decimals',
                    type: numberTypeNode('u8'),
                }),
            ],
            name: 'transfer',
        });

        // When we build the fallback list.
        const result = await listFallback(
            displayContext({ parsedInstruction: parsedInstruction({ data: { decimals: 6 }, instruction }) }),
        );

        // Then we expect the argument to be shown as a backup.
        expect(result).toEqual([{ label: 'Decimals', value: '6' }]);
    });

    test('it flattens a linked struct argument with a prefix', async () => {
        // Given an argument whose type links to a struct and is flattened with a prefix.
        const orderArgs = definedTypeNode({
            name: 'orderArgs',
            type: structTypeNode([
                structFieldTypeNode({ name: 'price', type: numberTypeNode('u64') }),
                structFieldTypeNode({ name: 'size', type: numberTypeNode('u64') }),
            ]),
        });
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    display: structFieldDisplayNode({ flatten: true, flattenPrefix: 'args.' }),
                    name: 'args',
                    type: definedTypeLinkNode('orderArgs'),
                }),
            ],
            name: 'placeOrder',
        });
        // When we build the fallback list.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({ data: { args: { price: 100n, size: 5n } }, instruction }),
                resolveDefinedType: mockResolveDefinedType(orderArgs),
            }),
        );

        // Then we expect the struct fields lifted into the list with the prefix.
        expect(result).toEqual([
            { label: 'args.Price', value: '100' },
            { label: 'args.Size', value: '5' },
        ]);
    });

    test('it renders remaining accounts under their group label', async () => {
        // Given a memo-shaped instruction with a labelled signers group. The label is distinct
        // from the derived `titleCase('signers')` form so this test cannot pass via derivation.
        const instruction = instructionNode({
            accounts: [],
            arguments: [],
            name: 'addMemo',
            remainingAccounts: [
                instructionRemainingAccountsNode(argumentValueNode('signers'), {
                    display: instructionAccountDisplayNode({ label: 'Memo Signers' }),
                    isOptional: true,
                    isSigner: true,
                }),
            ],
        });

        // When we build the fallback list with two trailing signer metas.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({
                    instruction,
                    remainingAccounts: [
                        [SIGNER_A, AccountRole.READONLY_SIGNER],
                        [SIGNER_B, AccountRole.READONLY_SIGNER],
                    ],
                }),
            }),
        );

        // Then we expect one numbered field per trailing account.
        expect(result).toEqual([
            { label: 'Memo Signers #1', value: SIGNER_A },
            { label: 'Memo Signers #2', value: SIGNER_B },
        ]);
    });

    test('it derives the remaining accounts label from the group value name', async () => {
        // Given a remaining-accounts group with no display label.
        const instruction = instructionNode({
            accounts: [],
            arguments: [],
            name: 'transfer',
            remainingAccounts: [
                instructionRemainingAccountsNode(argumentValueNode('multiSigners'), { isSigner: true }),
            ],
        });

        // When we build the fallback list with one trailing meta.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({
                    instruction,
                    remainingAccounts: [[SIGNER_A, AccountRole.READONLY_SIGNER]],
                }),
            }),
        );

        // Then we expect the title-cased value name as label, unnumbered for a single account.
        expect(result).toEqual([{ label: 'Multi Signers', value: SIGNER_A }]);
    });

    test('it hides remaining accounts whose group is skipped', async () => {
        // Given a remaining-accounts group marked skip always.
        const instruction = instructionNode({
            accounts: [],
            arguments: [],
            name: 'transfer',
            remainingAccounts: [
                instructionRemainingAccountsNode(argumentValueNode('multiSigners'), {
                    display: instructionAccountDisplayNode({ skip: 'always' }),
                    isSigner: true,
                }),
            ],
        });

        // When we build the fallback list with a trailing meta.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({
                    instruction,
                    remainingAccounts: [[SIGNER_A, AccountRole.READONLY_SIGNER]],
                }),
            }),
        );

        // Then we expect no fields.
        expect(result).toEqual([]);
    });

    test('it partitions trailing metas between groups by signer role', async () => {
        // Given two remaining-accounts groups: signers first, then non-signing sources.
        const instruction = instructionNode({
            accounts: [],
            arguments: [],
            name: 'withdrawWithheldTokensFromAccounts',
            remainingAccounts: [
                instructionRemainingAccountsNode(argumentValueNode('multiSigners'), {
                    display: instructionAccountDisplayNode({ label: 'Multisig Signers' }),
                    isSigner: true,
                }),
                instructionRemainingAccountsNode(argumentValueNode('sources'), {
                    display: instructionAccountDisplayNode({ label: 'Source Accounts' }),
                    isSigner: false,
                }),
            ],
        });

        // When we build the fallback list with one signer then two non-signer metas.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({
                    instruction,
                    remainingAccounts: [
                        [SIGNER_A, AccountRole.READONLY_SIGNER],
                        [SOURCE_A, AccountRole.WRITABLE],
                        [SOURCE_B, AccountRole.WRITABLE],
                    ],
                }),
            }),
        );

        // Then we expect the signer run under the first group and the rest under the final group.
        expect(result).toEqual([
            { label: 'Multisig Signers', value: SIGNER_A },
            { label: 'Source Accounts #1', value: SOURCE_A },
            { label: 'Source Accounts #2', value: SOURCE_B },
        ]);
    });

    test('it expands an address array into one field per element', async () => {
        // Given a lookup-table-shaped instruction with an address-array argument.
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    display: structFieldDisplayNode({ label: 'New Addresses' }),
                    name: 'addresses',
                    type: arrayTypeNode(publicKeyTypeNode(), remainderCountNode()),
                }),
            ],
            name: 'extendLookupTable',
        });

        // When we build the fallback list with two addresses.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({ data: { addresses: [SIGNER_A, SIGNER_B] }, instruction }),
            }),
        );

        // Then we expect one numbered field per address, matching how accounts are rendered.
        expect(result).toEqual([
            { label: 'New Addresses #1', value: SIGNER_A },
            { label: 'New Addresses #2', value: SIGNER_B },
        ]);
    });

    test('it keeps a single-element address array unnumbered', async () => {
        // Given an address-array argument holding one address.
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    name: 'addresses',
                    type: arrayTypeNode(publicKeyTypeNode(), remainderCountNode()),
                }),
            ],
            name: 'extendLookupTable',
        });

        // When we build the fallback list.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({ data: { addresses: [SIGNER_A] }, instruction }),
            }),
        );

        // Then we expect a single unnumbered field.
        expect(result).toEqual([{ label: 'Addresses', value: SIGNER_A }]);
    });

    test('it renders non-address arrays as one compact field', async () => {
        // Given a numeric array argument.
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    name: 'values',
                    type: arrayTypeNode(numberTypeNode('u8'), remainderCountNode()),
                }),
            ],
            name: 'setValues',
        });

        // When we build the fallback list.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({ data: { values: [1, 2, 3] }, instruction }),
            }),
        );

        // Then we expect a single comma-joined field, not one line per number.
        expect(result).toEqual([{ label: 'Values', value: '1, 2, 3' }]);
    });

    test('it marks an amount whose scale cannot be resolved as raw', async () => {
        // Given an amount whose injected decimals have no provider.
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    name: 'amount',
                    type: numberTypeNode('u64', 'le', {
                        display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
                    }),
                }),
            ],
            name: 'transfer',
        });

        // When we build the fallback list.
        const result = await listFallback(
            displayContext({ parsedInstruction: parsedInstruction({ data: { amount: 1_000_000n }, instruction }) }),
        );

        // Then we expect the raw value explicitly marked, so it cannot read as a scaled amount.
        expect(result).toEqual([{ label: 'Amount', value: '1000000 (raw)' }]);
    });

    test('it flattens a present option-wrapped struct argument', async () => {
        // Given a flattened argument whose type is an option of a linked struct.
        const orderArgs = definedTypeNode({
            name: 'orderArgs',
            type: structTypeNode([
                structFieldTypeNode({ name: 'price', type: numberTypeNode('u64') }),
                structFieldTypeNode({ name: 'size', type: numberTypeNode('u64') }),
            ]),
        });
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    display: structFieldDisplayNode({ flatten: true }),
                    name: 'args',
                    type: optionTypeNode(definedTypeLinkNode('orderArgs')),
                }),
            ],
            name: 'placeOrder',
        });

        // When we build the fallback list with a `Some` value.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({
                    data: { args: { __option: 'Some', value: { price: 100n, size: 5n } } },
                    instruction,
                }),
                resolveDefinedType: mockResolveDefinedType(orderArgs),
            }),
        );

        // Then we expect the inner struct's fields lifted into the list.
        expect(result).toEqual([
            { label: 'Price', value: '100' },
            { label: 'Size', value: '5' },
        ]);
    });

    test('it renders an absent option-wrapped struct argument as a single none field', async () => {
        // Given a flattened argument whose type is an option of a struct.
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    display: structFieldDisplayNode({ flatten: true }),
                    name: 'args',
                    type: optionTypeNode(
                        structTypeNode([structFieldTypeNode({ name: 'price', type: numberTypeNode('u64') })]),
                    ),
                }),
            ],
            name: 'placeOrder',
        });

        // When we build the fallback list with a `None` value.
        const result = await listFallback(
            displayContext({
                parsedInstruction: parsedInstruction({ data: { args: { __option: 'None' } }, instruction }),
            }),
        );

        // Then we expect a single field marking the absence, not a flattened struct.
        expect(result).toEqual([{ label: 'Args', value: 'none' }]);
    });
});
