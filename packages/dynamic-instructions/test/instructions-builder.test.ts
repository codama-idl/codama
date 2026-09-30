import { CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE } from '@codama/errors';
import { getBase16Encoder } from '@solana/codecs';
import { AccountRole } from '@solana/instructions';
import {
    instructionAccountNode,
    instructionNode,
    instructionRemainingAccountsNode,
    integerTypeNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { createInstructionsBuilder } from '../src';
import { generateAddress, getInstructionPath, PROGRAM_ADDRESS } from './_setup';

const transfer = instructionNode({
    accounts: [
        instructionAccountNode({ identifier: 'source', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'authority', isSigner: 'either', isWritable: false }),
    ],
    data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u16') })]),
    identifier: 'transfer',
    remainingAccounts: [instructionRemainingAccountsNode('signers', { isOptional: true, isSigner: true })],
});

describe('createInstructionsBuilder', () => {
    test('it builds instructions from their accounts, data and signers', async () => {
        const [source, authority, signer] = await Promise.all([
            generateAddress(),
            generateAddress(),
            generateAddress(),
        ]);
        const build = createInstructionsBuilder(getInstructionPath(transfer));
        const instruction = await build({
            accounts: { authority, signers: [signer], source },
            data: { amount: 42 },
            signers: ['authority'],
        });
        expect(instruction).toStrictEqual({
            accounts: [
                { address: source, role: AccountRole.WRITABLE },
                { address: authority, role: AccountRole.READONLY_SIGNER },
                { address: signer, role: AccountRole.READONLY_SIGNER },
            ],
            data: getBase16Encoder().encode('2a00'),
            programAddress: PROGRAM_ADDRESS,
        });
    });

    test('it builds instructions without inputs', async () => {
        const build = createInstructionsBuilder(getInstructionPath(instructionNode({ identifier: 'noop' })));
        expect(await build()).toStrictEqual({ accounts: [], data: new Uint8Array(), programAddress: PROGRAM_ADDRESS });
    });

    test('it uses the address of the program defining the instruction', async () => {
        const otherAddress = await generateAddress();
        const noop = instructionNode({ identifier: 'noop' });
        const other = programNode({ identifier: 'other', instructions: [noop], publicKey: otherAddress });
        const root = rootNode(programNode({ identifier: 'main', publicKey: PROGRAM_ADDRESS }), {
            additionalPrograms: [other],
        });
        const build = createInstructionsBuilder([root, other, noop]);
        expect((await build()).programAddress).toBe(otherAddress);
    });

    test('it rejects data of the wrong type', async () => {
        const [source, authority] = await Promise.all([generateAddress(), generateAddress()]);
        const build = createInstructionsBuilder(getInstructionPath(transfer));
        await expect(build({ accounts: { authority, source }, data: { amount: 'abc' } })).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ __code: CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE }),
            }),
        );
    });
});
