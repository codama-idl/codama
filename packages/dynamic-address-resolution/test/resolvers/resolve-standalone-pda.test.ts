import { address, getAddressEncoder, getProgramDerivedAddress } from '@solana/addresses';
import { getU32Encoder, getUtf8Codec } from '@solana/codecs';
import {
    constantPdaSeedNode,
    mapValueNode,
    numberTypeNode,
    numberValueNode,
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

import { resolveStandalonePda } from '../../src/resolvers/resolve-standalone-pda';
import { generateAddress } from '../test-utils';

const PROGRAM_ADDRESS = address('11111111111111111111111111111111');

function makeRoot() {
    return rootNode(programNode({ name: 'test', publicKey: PROGRAM_ADDRESS }));
}

describe('resolveStandalonePda', () => {
    test('should derive PDA from mixed constant seeds', async () => {
        const extraKey = await generateAddress();
        const pda = pdaNode({
            name: 'mixed',
            seeds: [
                constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('prefix')),
                constantPdaSeedNode(publicKeyTypeNode(), programIdValueNode()),
                constantPdaSeedNode(numberTypeNode('u8'), numberValueNode(7)),
                constantPdaSeedNode(publicKeyTypeNode(), publicKeyValueNode(extraKey)),
            ],
        });

        const expected = await getProgramDerivedAddress({
            programAddress: PROGRAM_ADDRESS,
            seeds: [
                getUtf8Codec().encode('prefix'),
                getAddressEncoder().encode(PROGRAM_ADDRESS),
                new Uint8Array([7]),
                getAddressEncoder().encode(extraKey),
            ],
        });

        const result = await resolveStandalonePda(makeRoot(), pda);
        expect(result).toEqual(expected);
    });

    test('should derive PDA from variable string seed', async () => {
        const pda = pdaNode({
            name: 'test',
            seeds: [variablePdaSeedNode('label', stringTypeNode('utf8'))],
        });

        const expected = await getProgramDerivedAddress({
            programAddress: PROGRAM_ADDRESS,
            seeds: [getUtf8Codec().encode('hello')],
        });

        const result = await resolveStandalonePda(makeRoot(), pda, { label: 'hello' });
        expect(result).toEqual(expected);
    });

    test('should derive PDA from variable number seed', async () => {
        const pda = pdaNode({
            name: 'test',
            seeds: [variablePdaSeedNode('count', numberTypeNode('u32'))],
        });

        const expected = await getProgramDerivedAddress({
            programAddress: PROGRAM_ADDRESS,
            seeds: [getU32Encoder().encode(123_456)],
        });

        const result = await resolveStandalonePda(makeRoot(), pda, { count: 123_456 });
        expect(result).toEqual(expected);
    });

    test('should encode optional remainderOptionTypeNode seed as zero bytes when input is missing', async () => {
        const pda = pdaNode({
            name: 'optional',
            seeds: [variablePdaSeedNode('maybe', remainderOptionTypeNode(stringTypeNode('utf8')))],
        });

        const expected = await getProgramDerivedAddress({
            programAddress: PROGRAM_ADDRESS,
            seeds: [new Uint8Array(0)],
        });

        const result = await resolveStandalonePda(makeRoot(), pda);
        expect(result).toEqual(expected);
    });

    test('should throw UNEXPECTED_NODE_KIND for unsupported constant seed value kind', async () => {
        const pda = pdaNode({
            name: 'bad',
            seeds: [constantPdaSeedNode(numberTypeNode('u8'), mapValueNode([])) as never],
        });

        await expect(resolveStandalonePda(makeRoot(), pda)).rejects.toThrow(/mapValueNode/);
    });

    test('should throw ARGUMENT_MISSING when a required variable seed input is omitted', async () => {
        const pda = pdaNode({
            name: 'requiresInput',
            seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())],
        });

        await expect(resolveStandalonePda(makeRoot(), pda)).rejects.toThrow(/owner/);
    });
});
