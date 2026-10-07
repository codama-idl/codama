import { getNodeCodec, isDecodedNode } from '@codama/dynamic-codecs';
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
import { AccountRole } from '@solana/instructions';
import { describe, expect, test } from 'vitest';

import { parseAccountData, parseData, parseEventData, parseInstruction, parseInstructionData } from '../src';
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
