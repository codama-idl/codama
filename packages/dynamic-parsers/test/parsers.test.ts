import { getNodeCodec, isDecodedNode } from '@codama/dynamic-codecs';
import { CODAMA_ERROR__LINKED_NODE_NOT_FOUND } from '@codama/errors';
import {
    accountNode,
    bytesTypeNode,
    constantDiscriminatorNode,
    constantValueNode,
    constantValueNodeFromBytes,
    definedTypeLinkNode,
    definedTypeNode,
    eventNode,
    fieldDiscriminatorNode,
    fixedSizeTransformNode,
    hiddenPrefixTransformNode,
    instructionAccountNode,
    InstructionNode,
    instructionNode,
    instructionRemainingAccountsNode,
    integerTypeNode,
    integerValueNode,
    optionTypeNode,
    programNode,
    rootNode,
    sizePrefixTransformNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { LinkableDictionary } from '@codama/visitors-core';
import { AccountRole } from '@solana/instructions';
import { describe, expect, expectTypeOf, test } from 'vitest';

import {
    matchesAccountData,
    parseAccountData,
    parseData,
    ParseDataOptions,
    parseEventData,
    parseInstruction,
    parseInstructionData,
} from '../src';
import { hex } from './_setup';

describe('parseAccountData', () => {
    test('it parses some account data from a root node', () => {
        const account = accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('9'),
                    identifier: 'discriminator',
                    type: integerTypeNode('u8'),
                }),
                structFieldTypeNode({
                    identifier: 'firstname',
                    type: stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u16'))] }),
                }),
                structFieldTypeNode({
                    identifier: 'age',
                    type: integerTypeNode('u8'),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'myAccount',
        });
        const root = rootNode(
            programNode({
                accounts: [account],
                identifier: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = parseAccountData(root, hex('090500416c6963652a'));
        expect(result).toStrictEqual(getNodeCodec([root, root.program, account]).decode(hex('090500416c6963652a')));
    });

    test('it returns the decoded account with its path, value and offsets', () => {
        const account = accountNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u32') })]),
            identifier: 'myAccount',
        });
        const root = rootNode(programNode({ accounts: [account], identifier: 'myProgram', publicKey: '1111' }));
        const result = parseAccountData(root, hex('2a000000'));
        expect(result).toMatchObject({
            path: [root, root.program, account],
            postOffset: 4,
            preOffset: 0,
            value: { value: 42n },
        });
    });

    test('it returns the decoded data of the account', () => {
        const account = accountNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u32') })]),
            identifier: 'myAccount',
        });
        const root = rootNode(programNode({ accounts: [account], identifier: 'myProgram', publicKey: '1111' }));
        const result = parseAccountData(root, hex('2a000000'));
        expect(isDecodedNode(result?.data, 'structTypeNode')).toBe(true);
        expect(result?.data.value).toStrictEqual({ value: 42n });
    });

    test('it decodes a single account without discriminator', () => {
        // Given a program with exactly one account without discriminator.
        const account = accountNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u32') })]),
            identifier: 'myAccount',
        });
        const root = rootNode(
            programNode({
                accounts: [account],
                identifier: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we parse account data that matches no discriminator.
        const result = parseAccountData(root, hex('2a000000'));
        // Then we expect the single account to be decoded via the fallback.
        expect(result).toMatchObject({
            path: [root, root.program, account],
            value: { value: 42n },
        });
    });

    test('it parses account data of recursive types', () => {
        // Given an account holding a linked list.
        const list = definedTypeNode({
            identifier: 'list',
            type: structTypeNode([
                structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u8') }),
                structFieldTypeNode({
                    identifier: 'next',
                    type: optionTypeNode(definedTypeLinkNode('list'), { prefix: integerTypeNode('u8') }),
                }),
            ]),
        });
        const account = accountNode({ data: definedTypeLinkNode('list'), identifier: 'myAccount' });
        const root = rootNode(
            programNode({ accounts: [account], definedTypes: [list], identifier: 'myProgram', publicKey: '1111' }),
        );

        // When we parse its data.
        const result = parseAccountData(root, hex('01010200'));

        // Then we get the whole list.
        expect(result).toMatchObject({
            path: [root, root.program, account],
            value: {
                next: { __option: 'Some', value: { next: { __option: 'None' }, value: 2n } },
                value: 1n,
            },
        });
    });
});

describe('parseInstructionData', () => {
    test('it parses some instruction data from a root node', () => {
        const instruction = instructionNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('9'),
                    identifier: 'discriminator',
                    type: integerTypeNode('u8'),
                }),
                structFieldTypeNode({
                    identifier: 'firstname',
                    type: stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u16'))] }),
                }),
                structFieldTypeNode({
                    identifier: 'age',
                    type: integerTypeNode('u8'),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'myInstruction',
        });
        const root = rootNode(
            programNode({
                identifier: 'myProgram',
                instructions: [instruction],
                publicKey: '1111',
            }),
        );
        const result = parseInstructionData(root, hex('090500416c6963652a'));
        expect(result).toMatchObject({
            path: [root, root.program, instruction],
            value: { age: 42n, discriminator: 9n, firstname: 'Alice' },
        });
    });

    test('it decodes a single instruction without discriminator', () => {
        // Given a program with exactly one instruction that has no discriminator (Memo-shaped).
        const instruction = instructionNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'message', type: stringTypeNode('utf8') })]),
            identifier: 'memo',
        });
        const root = rootNode(
            programNode({
                identifier: 'myProgram',
                instructions: [instruction],
                publicKey: '1111',
            }),
        );

        // When we parse instruction data that has no discriminator selector ("Hello" as UTF-8).
        const result = parseInstructionData(root, hex('48656c6c6f'));

        // Then we expect instruction to be decoded.
        expect(result).toMatchObject({
            path: [root, root.program, instruction],
            value: { message: 'Hello' },
        });
    });

    test('it does not fall back to direct decode when the program has more than one instruction', () => {
        // Given a program with two instructions without discriminator.
        const root = rootNode(
            programNode({
                identifier: 'myProgram',
                instructions: [
                    instructionNode({
                        data: structTypeNode([
                            structFieldTypeNode({ identifier: 'message', type: stringTypeNode('utf8') }),
                        ]),
                        identifier: 'instructionA',
                    }),
                    instructionNode({
                        data: structTypeNode([
                            structFieldTypeNode({ identifier: 'message', type: stringTypeNode('utf8') }),
                        ]),
                        identifier: 'instructionB',
                    }),
                ],
                publicKey: '1111',
            }),
        );

        // When we parse instruction data that matches no discriminator.
        const result = parseInstructionData(root, hex('48656c6c6f'));

        // Then we expect no result.
        expect(result).toBeUndefined();
    });

    test('it returns undefined for a single instruction with a discriminator that does not match', () => {
        // Given a program with one instruction that declares a discriminator field.
        const root = rootNode(
            programNode({
                identifier: 'myProgram',
                instructions: [
                    instructionNode({
                        data: structTypeNode([
                            structFieldTypeNode({
                                defaultValue: integerValueNode('42'),
                                identifier: 'discriminator',
                                type: integerTypeNode('u8'),
                            }),
                        ]),
                        discriminators: [fieldDiscriminatorNode('discriminator')],
                        identifier: 'myInstruction',
                    }),
                ],
                publicKey: '1111',
            }),
        );

        // When we parse bytes whose leading byte (0x07) does not match the discriminator default (42).
        const result = parseInstructionData(root, hex('07'));

        // Then we expect no result.
        expect(result).toBeUndefined();
    });

    test('it does not decode via fallback when an instruction with discriminator also exists', () => {
        // Given a program with instruction with discriminator and instruction without discriminator.
        const root = rootNode(
            programNode({
                identifier: 'myProgram',
                instructions: [
                    instructionNode({
                        data: structTypeNode([
                            structFieldTypeNode({
                                defaultValue: integerValueNode('9'),
                                identifier: 'discriminator',
                                type: integerTypeNode('u8'),
                            }),
                        ]),
                        discriminators: [fieldDiscriminatorNode('discriminator')],
                        identifier: 'instructionWithDiscriminator',
                    }),
                    instructionNode({
                        data: structTypeNode([
                            structFieldTypeNode({ identifier: 'message', type: stringTypeNode('utf8') }),
                        ]),
                        identifier: 'instructionWithoutDiscriminator',
                    }),
                ],
                publicKey: '1111',
            }),
        );
        // When we parse bytes whose leading byte (0x48) does not match the discriminator default (9).
        const result = parseInstructionData(root, hex('48656c6c6f'));
        // Then we expect no result because more than one instruction candidate exists.
        expect(result).toBeUndefined();
    });
});

describe('parseEventData', () => {
    test('it parses some event data from a root node', () => {
        const event = eventNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('9'),
                    identifier: 'discriminator',
                    type: integerTypeNode('u8'),
                }),
                structFieldTypeNode({
                    identifier: 'firstname',
                    type: stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u16'))] }),
                }),
                structFieldTypeNode({
                    identifier: 'age',
                    type: integerTypeNode('u8'),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'myEvent',
        });
        const root = rootNode(
            programNode({
                events: [event],
                identifier: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = parseEventData(root, hex('090500416c6963652a'));
        expect(result).toMatchObject({
            path: [root, root.program, event],
            value: { age: 42n, discriminator: 9n, firstname: 'Alice' },
        });
    });
    test('it parses tuple event data from a root node', () => {
        const event = eventNode({
            data: tupleTypeNode([integerTypeNode('u32')], {
                transforms: [
                    hiddenPrefixTransformNode([
                        constantValueNode(
                            bytesTypeNode({ transforms: [fixedSizeTransformNode(2)] }),
                            constantValueNodeFromBytes('base16', '0102'),
                        ),
                    ]),
                ],
            }),
            discriminators: [
                constantDiscriminatorNode(
                    constantValueNode(
                        bytesTypeNode({ transforms: [fixedSizeTransformNode(2)] }),
                        constantValueNodeFromBytes('base16', '0102'),
                    ),
                ),
            ],
            identifier: 'tupleEvent',
        });
        const root = rootNode(
            programNode({
                events: [event],
                identifier: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = parseEventData(root, hex('01022a000000'));
        expect(result).toMatchObject({
            path: [root, root.program, event],
            value: [42n],
        });
    });

    test('it decodes a single event without discriminator', () => {
        // Given a program with exactly one non-discriminated event.
        const event = eventNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u32') })]),
            identifier: 'myEvent',
        });
        const root = rootNode(
            programNode({
                events: [event],
                identifier: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we parse event data that matches no discriminator.
        const result = parseEventData(root, hex('2a000000'));
        // Then we expect the event to be decoded via the fallback.
        expect(result).toMatchObject({
            path: [root, root.program, event],
            value: { value: 42n },
        });
    });
});

describe('parseInstruction', () => {
    test('it parses a single instruction without discriminator', () => {
        // Given a Memo-shaped program: one instruction without discriminator with a single signer account.
        const memoInstruction = instructionNode({
            accounts: [instructionAccountNode({ identifier: 'signer', isSigner: true, isWritable: false })],
            data: structTypeNode([structFieldTypeNode({ identifier: 'message', type: stringTypeNode('utf8') })]),
            identifier: 'memo',
        });
        const root = rootNode(
            programNode({
                identifier: 'myProgram',
                instructions: [memoInstruction],
                publicKey: '1111',
            }),
        );

        // And a concrete instruction carrying "Hello" as UTF-8 data and one account meta.
        const instruction = {
            accounts: [{ address: '1111', role: AccountRole.READONLY_SIGNER }],
            data: hex('48656c6c6f'),
            programAddress: '1111',
        } as unknown as Parameters<typeof parseInstruction>[1];

        // When we parse the instruction.
        const result = parseInstruction(root, instruction);

        // Then we expect the decoded instruction and the account meta with its identifier.
        expect(result).toStrictEqual({
            ...getNodeCodec([root, root.program, memoInstruction]).decode(hex('48656c6c6f')),
            accounts: [{ address: '1111', identifier: 'signer', role: AccountRole.READONLY_SIGNER }],
            remainingAccounts: [],
            unidentifiedAccounts: [],
        });
    });

    test('it captures account metas beyond the named accounts as remaining accounts', () => {
        // Given an instruction with one named account and a remaining-accounts group.
        const instruction = instructionNode({
            accounts: [instructionAccountNode({ identifier: 'source', isSigner: false, isWritable: true })],
            data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u8') })]),
            identifier: 'transfer',
            remainingAccounts: [instructionRemainingAccountsNode('multiSigners', { isSigner: true })],
        });
        const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));

        // When we parse a concrete instruction carrying two metas beyond the named account.
        const result = parseInstruction(root, {
            accounts: [
                { address: 'source11', role: AccountRole.WRITABLE },
                { address: 'signerA1', role: AccountRole.READONLY_SIGNER },
                { address: 'signerB1', role: AccountRole.READONLY_SIGNER },
            ],
            data: hex('2a'),
            programAddress: '1111',
        } as unknown as Parameters<typeof parseInstruction>[1]);

        // Then we expect the trailing metas captured as remaining accounts.
        expect(result?.remainingAccounts).toStrictEqual([
            { address: 'signerA1', role: AccountRole.READONLY_SIGNER },
            { address: 'signerB1', role: AccountRole.READONLY_SIGNER },
        ]);
    });

    test('it parses an instruction from an additional program using the program address', () => {
        // Given a token-shaped main program and an ATA-shaped additional program whose
        // instructions share the same one-byte field discriminator.
        const discriminator = (defaultValue: number) =>
            structFieldTypeNode({
                defaultValue: integerValueNode(String(defaultValue)),
                identifier: 'discriminator',
                type: integerTypeNode('u8'),
            });
        const additionalInstruction = instructionNode({
            accounts: [
                instructionAccountNode({ identifier: 'payer', isSigner: true, isWritable: true }),
                instructionAccountNode({ identifier: 'ata', isSigner: false, isWritable: true }),
            ],
            data: structTypeNode([discriminator(1)]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'createAssociatedTokenIdempotent',
        });
        const additionalProgram = programNode({
            identifier: 'associatedToken',
            instructions: [additionalInstruction],
            publicKey: '2222',
        });
        const root = rootNode(
            programNode({
                identifier: 'token',
                instructions: [
                    instructionNode({
                        accounts: [
                            instructionAccountNode({ identifier: 'account', isSigner: false, isWritable: true }),
                        ],
                        data: structTypeNode([discriminator(1)]),
                        discriminators: [fieldDiscriminatorNode('discriminator')],
                        identifier: 'initializeAccount',
                    }),
                ],
                publicKey: '1111',
            }),
            { additionalPrograms: [additionalProgram] },
        );

        // And a concrete instruction targeting the additional program's address.
        const instruction = {
            accounts: [
                { address: 'payer111', role: AccountRole.WRITABLE_SIGNER },
                { address: 'ata11111', role: AccountRole.WRITABLE },
            ],
            data: hex('01'),
            programAddress: '2222',
        } as unknown as Parameters<typeof parseInstruction>[1];

        // When we parse the instruction.
        const result = parseInstruction(root, instruction);

        // Then we expect the additional program's instruction, not the main program's.
        expect(result).toMatchObject({
            accounts: [
                { address: 'payer111', identifier: 'payer', role: AccountRole.WRITABLE_SIGNER },
                { address: 'ata11111', identifier: 'ata', role: AccountRole.WRITABLE },
            ],
            path: [root, additionalProgram, additionalInstruction],
            remainingAccounts: [],
            value: { discriminator: 1n },
        });
    });
    test('it returns no remaining accounts when there are no account metas beyond the named accounts', () => {
        const instruction = instructionNode({
            accounts: [instructionAccountNode({ identifier: 'source', isSigner: false, isWritable: true })],
            identifier: 'close',
        });
        const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));
        const result = parseInstruction(root, {
            accounts: [{ address: 'source11', role: AccountRole.WRITABLE }],
            data: hex(''),
            programAddress: '1111',
        } as unknown as Parameters<typeof parseInstruction>[1]);
        expect(result?.remainingAccounts).toStrictEqual([]);
    });

    test('it only names the account metas that are provided', () => {
        const instruction = instructionNode({
            accounts: [
                instructionAccountNode({ identifier: 'source', isSigner: false, isWritable: true }),
                instructionAccountNode({ identifier: 'destination', isSigner: false, isWritable: true }),
            ],
            identifier: 'transfer',
        });
        const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));
        const result = parseInstruction(root, {
            accounts: [{ address: 'source11', role: AccountRole.WRITABLE }],
            data: hex(''),
            programAddress: '1111',
        } as unknown as Parameters<typeof parseInstruction>[1]);
        expect(result?.accounts).toStrictEqual([
            { address: 'source11', identifier: 'source', role: AccountRole.WRITABLE },
        ]);
    });

    describe('optional accounts', () => {
        const required = (identifier: string) =>
            instructionAccountNode({ identifier, isSigner: false, isWritable: true });
        const optional = (identifier: string) =>
            instructionAccountNode({ identifier, isOptional: true, isSigner: false, isWritable: true });
        const meta = (address: string, role: AccountRole = AccountRole.WRITABLE) => ({ address, role });
        const parse = (instruction: InstructionNode, metas: (ReturnType<typeof meta> | string)[]) =>
            parseInstruction(
                rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' })),
                {
                    accounts: metas.map(item => (typeof item === 'string' ? meta(item) : item)),
                    data: hex(''),
                    programAddress: '1111',
                } as unknown as Parameters<typeof parseInstruction>[1],
            );

        test('it leaves out optional accounts omitted with the program address', () => {
            // Given an optional `referrer` between two accounts, with the default `programId` strategy.
            const instruction = instructionNode({
                accounts: [required('source'), optional('referrer'), required('destination')],
                identifier: 'transfer',
            });

            // When the referrer is omitted by passing the program address in its slot.
            const result = parse(instruction, ['source11', '1111', 'dest1111']);

            // Then we expect the referrer to be absent, rather than named after the program address.
            expect(result).toMatchObject({
                accounts: [
                    { ...meta('source11'), identifier: 'source' },
                    { ...meta('dest1111'), identifier: 'destination' },
                ],
                remainingAccounts: [],
                unidentifiedAccounts: [],
            });
        });

        test('it names required accounts holding the program address with the programId strategy', () => {
            const instruction = instructionNode({ accounts: [required('program')], identifier: 'invoke' });
            expect(parse(instruction, ['1111'])?.accounts).toStrictEqual([{ ...meta('1111'), identifier: 'program' }]);
        });

        test('it names optional accounts holding the program address with the omitted strategy', () => {
            const instruction = instructionNode({
                accounts: [optional('referrer')],
                identifier: 'refer',
                optionalAccountStrategy: 'omitted',
            });
            expect(parse(instruction, ['1111'])?.accounts).toStrictEqual([{ ...meta('1111'), identifier: 'referrer' }]);
        });

        test('it names all accounts when every optional account is present with the omitted strategy', () => {
            const instruction = instructionNode({
                accounts: [required('source'), optional('referrer'), required('destination')],
                identifier: 'transfer',
                optionalAccountStrategy: 'omitted',
            });
            expect(parse(instruction, ['source11', 'refer111', 'dest1111'])).toMatchObject({
                accounts: [
                    { ...meta('source11'), identifier: 'source' },
                    { ...meta('refer111'), identifier: 'referrer' },
                    { ...meta('dest1111'), identifier: 'destination' },
                ],
                remainingAccounts: [],
                unidentifiedAccounts: [],
            });
        });

        test('it shifts the accounts after an omitted optional account with the omitted strategy', () => {
            // Given an optional `referrer` between two accounts, with the `omitted` strategy.
            const instruction = instructionNode({
                accounts: [required('source'), optional('referrer'), required('destination')],
                identifier: 'transfer',
                optionalAccountStrategy: 'omitted',
            });

            // When the referrer is left out, so only two metas are provided.
            const result = parse(instruction, ['source11', 'dest1111']);

            // Then we expect the second meta to be the destination, not the referrer.
            expect(result).toMatchObject({
                accounts: [
                    { ...meta('source11'), identifier: 'source' },
                    { ...meta('dest1111'), identifier: 'destination' },
                ],
                remainingAccounts: [],
                unidentifiedAccounts: [],
            });
        });

        test('it leaves accounts unidentified when the omitted optional accounts are ambiguous', () => {
            // Given two optional accounts, with the `omitted` strategy.
            const instruction = instructionNode({
                accounts: [
                    required('source'),
                    optional('referrer'),
                    required('destination'),
                    optional('memo'),
                    required('authority'),
                ],
                identifier: 'transfer',
                optionalAccountStrategy: 'omitted',
            });

            // When one of them is left out: it could be either of them.
            const result = parse(instruction, ['source11', 'middle11', 'middle22', 'auth1111']);

            // Then we expect the accounts whose position is certain to be named, and the others unidentified.
            expect(result).toMatchObject({
                accounts: [
                    { ...meta('source11'), identifier: 'source' },
                    { ...meta('auth1111'), identifier: 'authority' },
                ],
                remainingAccounts: [],
                unidentifiedAccounts: [meta('middle11'), meta('middle22')],
            });
        });

        test('it leaves accounts unidentified when they could be omitted optional accounts or remaining accounts', () => {
            // Given an optional account followed by a required one and remaining accounts, with the `omitted` strategy.
            const instruction = instructionNode({
                accounts: [required('source'), optional('referrer'), required('destination')],
                identifier: 'transfer',
                optionalAccountStrategy: 'omitted',
                remainingAccounts: [instructionRemainingAccountsNode('signers')],
            });

            // When four metas are provided: the referrer may be present, or omitted with one more remaining account.
            const result = parse(instruction, ['source11', 'middle11', 'middle22', 'signer11']);

            // Then we expect the ambiguous metas unidentified, and only the ones beyond all named accounts as remaining.
            expect(result).toMatchObject({
                accounts: [{ ...meta('source11'), identifier: 'source' }],
                remainingAccounts: [meta('signer11')],
                unidentifiedAccounts: [meta('middle11'), meta('middle22')],
            });
        });

        test('it leaves accounts unidentified when fewer metas than required accounts are provided with the omitted strategy', () => {
            // Given an optional account followed by two required ones, with the `omitted` strategy.
            const instruction = instructionNode({
                accounts: [required('source'), optional('referrer'), required('destination'), required('authority')],
                identifier: 'transfer',
                optionalAccountStrategy: 'omitted',
            });

            // When only two metas are provided: the second one could be the referrer or the destination.
            const result = parse(instruction, ['source11', 'middle11']);

            // Then we expect it unidentified.
            expect(result).toMatchObject({
                accounts: [{ ...meta('source11'), identifier: 'source' }],
                remainingAccounts: [],
                unidentifiedAccounts: [meta('middle11')],
            });
        });

        test('it names all accounts when too few metas are provided for remaining accounts with the omitted strategy', () => {
            const instruction = instructionNode({
                accounts: [required('source'), optional('referrer'), required('destination')],
                identifier: 'transfer',
                optionalAccountStrategy: 'omitted',
                remainingAccounts: [instructionRemainingAccountsNode('signers')],
            });
            expect(parse(instruction, ['source11', 'dest1111'])).toMatchObject({
                accounts: [
                    { ...meta('source11'), identifier: 'source' },
                    { ...meta('dest1111'), identifier: 'destination' },
                ],
                remainingAccounts: [],
                unidentifiedAccounts: [],
            });
        });

        test('it names all accounts when the roles of the accounts tell which optional accounts are omitted', () => {
            // Given an optional read-only `referrer` before a writable `destination`, and remaining accounts.
            const instruction = instructionNode({
                accounts: [
                    required('source'),
                    instructionAccountNode({
                        identifier: 'referrer',
                        isOptional: true,
                        isSigner: 'either',
                        isWritable: false,
                    }),
                    required('destination'),
                ],
                identifier: 'transfer',
                optionalAccountStrategy: 'omitted',
                remainingAccounts: [instructionRemainingAccountsNode('signers')],
            });

            // When the second meta is read-only, so it cannot be the destination.
            const metas = [
                meta('source11'),
                meta('refer111', AccountRole.READONLY),
                meta('dest1111'),
                meta('signer11', AccountRole.READONLY_SIGNER),
            ];
            const result = parse(instruction, metas);

            // Then we expect the referrer to be present, so every account is named.
            expect(result).toMatchObject({
                accounts: [
                    { ...metas[0], identifier: 'source' },
                    { ...metas[1], identifier: 'referrer' },
                    { ...metas[2], identifier: 'destination' },
                ],
                remainingAccounts: [metas[3]],
                unidentifiedAccounts: [],
            });
        });

        test('it names all accounts when the roles of the remaining accounts tell which optional accounts are omitted', () => {
            // Given an optional account followed by a required one and signer remaining accounts.
            const instruction = instructionNode({
                accounts: [required('source'), optional('referrer'), required('destination')],
                identifier: 'transfer',
                optionalAccountStrategy: 'omitted',
                remainingAccounts: [instructionRemainingAccountsNode('signers', { isSigner: true })],
            });

            // When the third meta is not a signer, so it cannot be a remaining account.
            const metas = ['source11', 'refer111', 'dest1111', meta('signer11', AccountRole.WRITABLE_SIGNER)];
            const result = parse(instruction, metas);

            // Then we expect the referrer to be present, so every account is named.
            expect(result).toMatchObject({
                accounts: [
                    { ...meta('source11'), identifier: 'source' },
                    { ...meta('refer111'), identifier: 'referrer' },
                    { ...meta('dest1111'), identifier: 'destination' },
                ],
                remainingAccounts: [meta('signer11', AccountRole.WRITABLE_SIGNER)],
                unidentifiedAccounts: [],
            });
        });

        test('it leaves accounts unidentified when their roles exceed the roles of every account they could be', () => {
            // Given an optional account followed by a required one and signer remaining accounts.
            const instruction = instructionNode({
                accounts: [required('source'), optional('referrer'), required('destination')],
                identifier: 'transfer',
                optionalAccountStrategy: 'omitted',
                remainingAccounts: [instructionRemainingAccountsNode('signers', { isSigner: true })],
            });

            // When the third meta is a signer: it could be the non-signer destination, since roles are
            // merged across the instructions of a transaction, or a remaining account.
            const signer = (address: string) => meta(address, AccountRole.WRITABLE_SIGNER);
            const result = parse(instruction, ['source11', 'middle11', signer('middle22'), signer('signer11')]);

            // Then we expect the ambiguous metas to stay unidentified.
            expect(result).toMatchObject({
                accounts: [{ ...meta('source11'), identifier: 'source' }],
                remainingAccounts: [signer('signer11')],
                unidentifiedAccounts: [meta('middle11'), signer('middle22')],
            });
        });

        test('it ignores the roles of the accounts when they contradict every placement of the metas', () => {
            // Given a single writable account.
            const instruction = instructionNode({ accounts: [required('source')], identifier: 'close' });

            // When its meta is read-only.
            const result = parse(instruction, [meta('source11', AccountRole.READONLY)]);

            // Then we expect it to be named after its position nonetheless.
            expect(result).toMatchObject({
                accounts: [{ ...meta('source11', AccountRole.READONLY), identifier: 'source' }],
                remainingAccounts: [],
                unidentifiedAccounts: [],
            });
        });
    });

    test('it decodes instruction bytes with the given bytes encoding', () => {
        const instruction = instructionNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'payload', type: bytesTypeNode() })]),
            identifier: 'myInstruction',
        });
        const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));
        const instructionToParse = {
            accounts: [],
            data: hex('0102'),
            programAddress: '1111',
        } as unknown as Parameters<typeof parseInstruction>[1];
        const result = parseInstruction(root, instructionToParse, { bytesEncoding: 'base16' });
        expect(result?.value).toStrictEqual({ payload: ['base16', '0102'] });
    });

    test('it returns undefined when the identified data cannot be decoded', () => {
        // Given an instruction whose discriminator matches one-byte data but whose full
        // arguments require more bytes than provided.
        const instruction = instructionNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('1'),
                    defaultValueStrategy: 'omitted',
                    identifier: 'discriminator',
                    type: integerTypeNode('u8'),
                }),
                structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'myInstruction',
        });
        const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));

        // When we parse truncated data: the discriminator matches but `amount` cannot decode.
        const result = parseInstruction(root, {
            accounts: [],
            data: hex('01'),
            programAddress: '1111',
        } as unknown as Parameters<typeof parseInstruction>[1]);

        // Then we expect undefined rather than a decode error: parsing is total.
        expect(result).toBeUndefined();
    });

    test('it does not parse an instruction whose program is not part of the root', () => {
        const root = rootNode(
            programNode({
                identifier: 'myProgram',
                instructions: [
                    instructionNode({
                        data: structTypeNode([
                            structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u8') }),
                        ]),
                        identifier: 'myInstruction',
                    }),
                ],
                publicKey: '1111',
            }),
        );
        const result = parseInstruction(root, {
            accounts: [],
            data: hex('01'),
            programAddress: '9999',
        } as unknown as Parameters<typeof parseInstruction>[1]);
        expect(result).toBeUndefined();
    });
});

describe('parseData', () => {
    test('it decodes via fallback a single node without discriminator', () => {
        // Given a program with one account without discriminator.
        const account = accountNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u32') })]),
            identifier: 'myAccount',
        });
        const root = rootNode(
            programNode({
                accounts: [account],
                identifier: 'myProgram',
                instructions: [
                    instructionNode({
                        data: structTypeNode([
                            structFieldTypeNode({ identifier: 'message', type: stringTypeNode('utf8') }),
                        ]),
                        identifier: 'myInstruction',
                    }),
                ],
                publicKey: '1111',
            }),
        );
        // When we parse only the account node kind and no discriminator matches.
        const result = parseData(root, hex('2a000000'), 'accountNode');
        // Then we expect the single account to be decoded via the fallback.
        expect(result).toMatchObject({
            path: [root, root.program, account],
            value: { value: 42n },
        });
    });

    test('it does not decode via fallback when trying to parse multiple node kinds without discriminator', () => {
        // Given a program with account and instruction without discriminators.
        const root = rootNode(
            programNode({
                accounts: [
                    accountNode({
                        data: structTypeNode([
                            structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u32') }),
                        ]),
                        identifier: 'accountWithoutDiscriminator',
                    }),
                ],
                identifier: 'myProgram',
                instructions: [
                    instructionNode({
                        data: structTypeNode([
                            structFieldTypeNode({ identifier: 'message', type: stringTypeNode('utf8') }),
                        ]),
                        identifier: 'instructionWithoutDiscriminator',
                    }),
                ],
                publicKey: '1111',
            }),
        );
        // When we parse with the default (all) kinds and no discriminator matches.
        const result = parseData(root, hex('2a000000'));
        // Then we expect no result because two candidates are ambiguous.
        expect(result).toBeUndefined();
    });

    test('it decodes bytes with the given bytes encoding', () => {
        const account = accountNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'payload', type: bytesTypeNode() })]),
            identifier: 'myAccount',
        });
        const root = rootNode(programNode({ accounts: [account], identifier: 'myProgram', publicKey: '1111' }));
        const result = parseData(root, hex('0102'), 'accountNode', { bytesEncoding: 'base16' });
        expect(result?.value).toStrictEqual({ payload: ['base16', '0102'] });
    });
});

describe('ParseDataOptions', () => {
    test('it does not accept options that are only used when encoding', () => {
        expectTypeOf<ParseDataOptions>().not.toHaveProperty('resolvedDefaultValues');
    });
});

describe('linkables', () => {
    // A single account and instruction without discriminators, whose data links to a defined type.
    const amount = definedTypeNode({ identifier: 'amount', type: integerTypeNode('u8') });
    const data = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: definedTypeLinkNode('amount') })]);
    const root = rootNode(
        programNode({
            accounts: [accountNode({ data, identifier: 'myAccount' })],
            definedTypes: [amount],
            identifier: 'myProgram',
            instructions: [instructionNode({ data, identifier: 'myInstruction' })],
            publicKey: '1111',
        }),
    );
    const linkedNodeNotFound = expect.objectContaining({
        context: expect.objectContaining({ __code: CODAMA_ERROR__LINKED_NODE_NOT_FOUND }),
    });

    test('it parses data using the given linkables rather than recording them', () => {
        const linkables = new LinkableDictionary();
        expect(() => parseAccountData(root, hex('2a'), { linkables })).toThrow(linkedNodeNotFound);
        expect(() => parseData(root, hex('2a'), 'accountNode', { linkables })).toThrow(linkedNodeNotFound);
    });

    test('it parses instructions using the given linkables rather than recording them', () => {
        const instruction = { accounts: [], data: hex('2a'), programAddress: '1111' } as unknown as Parameters<
            typeof parseInstruction
        >[1];
        expect(() => parseInstruction(root, instruction, { linkables: new LinkableDictionary() })).toThrow(
            linkedNodeNotFound,
        );
    });
});

describe('matchesAccountData', () => {
    // A mint discriminated by its first byte, and an account without discriminators.
    const mint = accountNode({
        data: structTypeNode([
            structFieldTypeNode({
                defaultValue: integerValueNode('1'),
                defaultValueStrategy: 'omitted',
                identifier: 'discriminator',
                type: integerTypeNode('u8'),
            }),
            structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') }),
        ]),
        discriminators: [fieldDiscriminatorNode('discriminator')],
        identifier: 'mint',
    });
    const anything = accountNode({ data: structTypeNode([]), identifier: 'anything' });
    const root = rootNode(programNode({ accounts: [mint, anything], identifier: 'myProgram', publicKey: '1111' }));

    test('it matches bytes matching the discriminators of the account', () => {
        expect(matchesAccountData([root, root.program, mint], hex('0106'))).toBe(true);
    });

    test('it does not match bytes of another account', () => {
        expect(matchesAccountData([root, root.program, mint], hex('0206'))).toBe(false);
    });

    test('it matches any bytes for accounts without discriminators', () => {
        expect(matchesAccountData([root, root.program, anything], hex('ff'))).toBe(true);
    });

    test('it uses the given linkables rather than recording them', () => {
        // Given a mint discriminated by a field of a linked type.
        const header = definedTypeNode({
            identifier: 'header',
            type: structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('1'),
                    identifier: 'kind',
                    type: integerTypeNode('u8'),
                }),
            ]),
        });
        const linked = accountNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'header', type: definedTypeLinkNode('header') })]),
            discriminators: [fieldDiscriminatorNode('header.kind')],
            identifier: 'linked',
        });
        const linkedRoot = rootNode(
            programNode({ accounts: [linked], definedTypes: [header], identifier: 'myProgram', publicKey: '1111' }),
        );
        expect(() =>
            matchesAccountData([linkedRoot, linkedRoot.program, linked], hex('01'), {
                linkables: new LinkableDictionary(),
            }),
        ).toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ __code: CODAMA_ERROR__LINKED_NODE_NOT_FOUND }),
            }),
        );
    });
});
