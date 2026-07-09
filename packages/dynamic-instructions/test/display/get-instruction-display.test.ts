import type { Address } from '@solana/addresses';
import {
    accountFieldValueNode,
    accountLinkNode,
    amountNumberDisplayNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumTypeNode,
    enumVariantDisplayNode,
    injectedValueNode,
    instructionAccountDisplayNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionDisplayNode,
    instructionNode,
    numberTypeNode,
    programNode,
    providedNode,
    rootNode,
    stringValueNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import {
    getInstructionDisplay,
    getInstructionDisplayFromParsedInstruction,
} from '../../src/display/get-instruction-display';
import {
    encodeAccountData,
    instructionPathOf,
    makeParsedInstruction,
    makeRoot,
    mintAccountNode,
    mockFetch,
} from '../test-utils';

const MINT = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY' as Address;
const DESTINATION = '3Wnd5Df69KitZfUoPYZU438eFRNwGHkhLnSAWL65PxJX' as Address;

describe('getInstructionDisplayFromParsedInstruction', () => {
    // A full token `transferChecked`, enriched with clear-signing display metadata, resolved
    // across the spec's three presentation tiers (interpolated, fallback-with-metadata, offline).
    test('it resolves a token transferChecked across all presentation tiers', async () => {
        // Given a transferChecked whose amount injects its mint decimals, transferring 1.5 USDC.
        const instruction = instructionNode({
            accounts: [
                instructionAccountNode({
                    display: instructionAccountDisplayNode({ skip: 'always' }),
                    isSigner: false,
                    isWritable: true,
                    name: 'source',
                }),
                instructionAccountNode({
                    accountLink: accountLinkNode('mint'),
                    display: instructionAccountDisplayNode({ label: 'Token Mint', skip: 'whenInjected' }),
                    isSigner: false,
                    isWritable: false,
                    name: 'mint',
                }),
                instructionAccountNode({
                    display: instructionAccountDisplayNode({ label: 'To' }),
                    isSigner: false,
                    isWritable: true,
                    name: 'destination',
                }),
                instructionAccountNode({
                    display: instructionAccountDisplayNode({ skip: 'always' }),
                    isSigner: true,
                    isWritable: false,
                    name: 'authority',
                }),
            ],
            arguments: [
                instructionArgumentNode({
                    display: structFieldDisplayNode({ skip: 'always' }),
                    name: 'discriminator',
                    type: numberTypeNode('u8'),
                }),
                instructionArgumentNode({
                    display: structFieldDisplayNode({ label: 'Amount' }),
                    name: 'amount',
                    type: numberTypeNode('u64', 'le', {
                        display: amountNumberDisplayNode({
                            decimals: injectedValueNode({ key: 'decimals' }),
                            unit: injectedValueNode({ key: 'symbol' }),
                        }),
                    }),
                }),
                instructionArgumentNode({
                    display: structFieldDisplayNode({ skip: 'always' }),
                    name: 'decimals',
                    type: numberTypeNode('u8'),
                }),
            ],
            display: instructionDisplayNode({
                intent: 'Transfer',
                interpolatedIntent: 'Transfer ${data.amount} to ${accounts.destination}',
            }),
            name: 'transferChecked',
            provides: [
                providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' })),
                providedNode('symbol', stringValueNode('USDC')),
            ],
        });
        const mint = mintAccountNode();
        const root = makeRoot([instruction], 'testProgram', [mint]);
        const parsed = makeParsedInstruction(
            root,
            instruction,
            { amount: 1_500_000n, decimals: 6, discriminator: 12 },
            new Map([
                ['mint', MINT],
                ['destination', DESTINATION],
            ]),
        );

        // When metadata is available, the amount is scaled and the consumed mint is hidden.
        const withMetadata = await getInstructionDisplayFromParsedInstruction(root, parsed, {
            fetchAccount: mockFetch([[MINT, encodeAccountData(root, mint, { decimals: 6 })]]),
        });
        expect(withMetadata.intent).toBe('Transfer');
        expect(withMetadata.interpolatedIntent).toBe(`Transfer 1.5 USDC to ${DESTINATION}`);
        expect(withMetadata.fields).toEqual([
            { label: 'Amount', value: '1.5 USDC' },
            { label: 'To', value: DESTINATION },
        ]);

        // When offline, the amount stays raw and the mint reappears as a backup (arguments first).
        const offline = await getInstructionDisplayFromParsedInstruction(root, parsed);
        expect(offline.interpolatedIntent).toBe(`Transfer 1500000 to ${DESTINATION}`);
        expect(offline.fields).toEqual([
            { label: 'Amount', value: '1500000' },
            { label: 'Token Mint', value: MINT },
            { label: 'To', value: DESTINATION },
        ]);
    });

    test('it derives the intent from the instruction name when no display metadata exists', async () => {
        // Given an instruction with no display metadata.
        const instruction = instructionNode({
            accounts: [],
            arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') })],
            name: 'transferTokens',
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 42n });

        // When we resolve its display.
        const display = await getInstructionDisplayFromParsedInstruction(root, parsed);

        // Then the intent is the title-cased name, there is no sentence, and the field shows raw data.
        expect(display.intent).toBe('Transfer Tokens');
        expect(display.interpolatedIntent).toBeNull();
        expect(display.fields).toEqual([{ label: 'Amount', value: '42' }]);
    });
});

describe('getInstructionDisplay', () => {
    test('it returns null when the instruction cannot be parsed', async () => {
        // Given a root whose program has no instruction matching the raw bytes. Two
        // discriminator-less instructions make the single-candidate fallback ambiguous, so the
        // parser cannot identify one.
        const root = makeRoot([
            instructionNode({ accounts: [], arguments: [], name: 'noop' }),
            instructionNode({ accounts: [], arguments: [], name: 'other' }),
        ]);

        // When we resolve the display of an unrecognized instruction.
        const display = await getInstructionDisplay(root, {
            accounts: [],
            data: new Uint8Array([255, 255, 255, 255]),
            programAddress: MINT,
        });

        // Then we get null rather than an error.
        expect(display).toBeNull();
    });
});

describe('cross-program link resolution', () => {
    // A link nested inside a type from another program must resolve in THAT program, not the
    // instruction's. Both programs define an `inner` enum with different labels; the field linking
    // to it (with no explicit program) must pick the one local to its enclosing defined type.
    test('it resolves a link nested in a foreign defined type against the foreign program', async () => {
        // Given program B defining `inner` (label "B Buy") and a `wrapper` struct using it.
        const innerInB = definedTypeNode({
            name: 'inner',
            type: enumTypeNode([
                enumEmptyVariantTypeNode('buy', undefined, { display: enumVariantDisplayNode({ label: 'B Buy' }) }),
            ]),
        });
        const wrapperInB = definedTypeNode({
            name: 'wrapper',
            // The nested link carries no program, so it must resolve within program B.
            type: structTypeNode([structFieldTypeNode({ name: 'mode', type: definedTypeLinkNode('inner') })]),
        });
        const programB = programNode({
            definedTypes: [innerInB, wrapperInB],
            instructions: [],
            name: 'programB',
            publicKey: '22222222222222222222222222222222',
        });

        // And program A defining its OWN `inner` (label "A Buy") — the wrong one to resolve.
        const innerInA = definedTypeNode({
            name: 'inner',
            type: enumTypeNode([
                enumEmptyVariantTypeNode('buy', undefined, { display: enumVariantDisplayNode({ label: 'A Buy' }) }),
            ]),
        });
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    // Flatten so the display descends into wrapper's fields, reaching the nested link.
                    display: structFieldDisplayNode({ flatten: true }),
                    name: 'order',
                    // Links to wrapper in program B.
                    type: definedTypeLinkNode('wrapper', 'programB'),
                }),
            ],
            name: 'placeOrder',
        });
        const programA = programNode({
            definedTypes: [innerInA],
            instructions: [instruction],
            name: 'programA',
            publicKey: '11111111111111111111111111111111',
        });
        const root = rootNode(programA, [programB]);
        const parsed = {
            accounts: [],
            // `inner` is an all-empty-variant (scalar) enum, decoded as the variant name.
            data: { order: { mode: 'buy' } },
            path: instructionPathOf(root, instruction),
        };

        // When we resolve the display.
        const display = await getInstructionDisplayFromParsedInstruction(root, parsed);

        // Then the nested link resolves to program B's `inner`, not program A's.
        expect(display.fields).toEqual([{ label: 'Mode', value: 'B Buy' }]);
    });
});
