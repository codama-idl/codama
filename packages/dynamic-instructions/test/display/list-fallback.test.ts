import type { Address } from '@solana/addresses';
import {
    definedTypeLinkNode,
    definedTypeNode,
    instructionAccountDisplayNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    type ProvidedNode,
    providedNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { listFallback } from '../../src/display/list-fallback';
import { displayContext } from '../test-utils';

const AUTHORITY = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY' as Address;

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
                accountAddresses: new Map([['destination', AUTHORITY]]),
                data: { amount: 42n },
                instruction,
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
                accountAddresses: new Map([['destination', AUTHORITY]]),
                data: { amount: 42n },
                instruction,
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
        const result = await listFallback(displayContext({ data: { amount: 42n, discriminator: 3 }, instruction }));

        // Then we expect only the visible argument.
        expect(result).toEqual([{ label: 'Amount', value: '42' }]);
    });

    test('it hides whenInjected members whose value is provided', async () => {
        // Given an argument marked whenInjected and a provider exposing its name.
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
        const provides = new Map<string, ProvidedNode>([['decimals', providedNode('decimals', numberValueNode(6))]]);

        // When we build the fallback list with that provider present.
        const result = await listFallback(displayContext({ data: { decimals: 6 }, instruction, provides }));

        // Then we expect the whenInjected argument to be hidden.
        expect(result).toEqual([]);
    });

    test('it shows whenInjected members when no provider exposes them', async () => {
        // Given an argument marked whenInjected and no matching provider.
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
        const result = await listFallback(displayContext({ data: { decimals: 6 }, instruction }));

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
        const resolveDefinedType = (link: { name: string }) => (link.name === 'orderArgs' ? orderArgs : undefined);

        // When we build the fallback list.
        const result = await listFallback(
            displayContext({
                data: { args: { price: 100n, size: 5n } },
                instruction,
                resolveDefinedType,
            }),
        );

        // Then we expect the struct fields lifted into the list with the prefix.
        expect(result).toEqual([
            { label: 'args.Price', value: '100' },
            { label: 'args.Size', value: '5' },
        ]);
    });
});
