import { CODAMA_ERROR__DYNAMIC_CLIENT__PDA_SEED_MISSING, CodamaError } from '@codama/errors';
import { getAddressEncoder, getProgramDerivedAddress } from '@solana/addresses';
import { getU32Encoder, getUtf8Encoder } from '@solana/codecs';
import {
    constantPdaSeedNode,
    integerTypeNode,
    integerValueNode,
    pdaNode,
    programIdValueNode,
    programNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    remainderOptionTypeNode,
    rootNode,
    stringTypeNode,
    stringValueNode,
    variablePdaSeedNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { resolveStandalonePda } from '../../src';
import { generateAddress, PROGRAM_ADDRESS } from '../test-utils';

function getPdaPath(pda: ReturnType<typeof pdaNode>) {
    const root = rootNode(programNode({ identifier: 'test', pdas: [pda], publicKey: PROGRAM_ADDRESS }));
    return [root, root.program, pda] as const;
}

describe('resolveStandalonePda', () => {
    test('it derives PDAs from constant seeds', async () => {
        const extraKey = await generateAddress();
        const pda = pdaNode({
            identifier: 'mixed',
            seeds: [
                constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('prefix')),
                constantPdaSeedNode(publicKeyTypeNode(), programIdValueNode()),
                constantPdaSeedNode(integerTypeNode('u8'), integerValueNode('7')),
                constantPdaSeedNode(publicKeyTypeNode(), publicKeyValueNode(extraKey)),
            ],
        });
        const expected = await getProgramDerivedAddress({
            programAddress: PROGRAM_ADDRESS,
            seeds: [
                getUtf8Encoder().encode('prefix'),
                getAddressEncoder().encode(PROGRAM_ADDRESS),
                new Uint8Array([7]),
                getAddressEncoder().encode(extraKey),
            ],
        });
        expect(await resolveStandalonePda({ path: getPdaPath(pda) })).toEqual(expected);
    });

    test('it derives PDAs from variable seeds', async () => {
        const pda = pdaNode({
            identifier: 'test',
            seeds: [
                variablePdaSeedNode('label', stringTypeNode('utf8')),
                variablePdaSeedNode('count', integerTypeNode('u32')),
            ],
        });
        const expected = await getProgramDerivedAddress({
            programAddress: PROGRAM_ADDRESS,
            seeds: [getUtf8Encoder().encode('hello'), getU32Encoder().encode(123_456)],
        });
        const result = await resolveStandalonePda({
            path: getPdaPath(pda),
            seedsInput: { count: 123_456, label: 'hello' },
        });
        expect(result).toEqual(expected);
    });

    test('it encodes missing remainder option seeds as zero bytes', async () => {
        const pda = pdaNode({
            identifier: 'optional',
            seeds: [variablePdaSeedNode('maybe', remainderOptionTypeNode(stringTypeNode('utf8')))],
        });
        const expected = await getProgramDerivedAddress({
            programAddress: PROGRAM_ADDRESS,
            seeds: [new Uint8Array(0)],
        });
        expect(await resolveStandalonePda({ path: getPdaPath(pda) })).toEqual(expected);
    });

    test('it throws when a variable seed is missing', async () => {
        const pda = pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())] });
        await expect(resolveStandalonePda({ path: getPdaPath(pda) })).rejects.toThrow(
            expect.objectContaining({
                context: new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__PDA_SEED_MISSING, {
                    pdaName: pda.identifier,
                    seedName: pda.seeds![0].identifier,
                }).context,
            }),
        );
    });
});
