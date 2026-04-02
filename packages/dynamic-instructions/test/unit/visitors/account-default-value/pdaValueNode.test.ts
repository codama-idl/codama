import { getAddressEncoder, getProgramDerivedAddress } from '@solana/addresses';
import { getUtf8Codec } from '@solana/codecs';
import {
    argumentValueNode,
    bytesTypeNode,
    constantPdaSeedNode,
    instructionArgumentNode,
    pdaLinkNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    stringTypeNode,
    stringValueNode,
    variablePdaSeedNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { ixNodeStub, makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitPdaValue', async () => {
    const testProgramAddress = await SvmTestContext.generateAddress();

    test('should derive PDA with constant seed', async () => {
        const pda = pdaNode({
            name: 'testPda',
            seeds: [constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('prefix'))],
        });
        const root = rootNode(programNode({ name: 'test', pdas: [pda], publicKey: testProgramAddress }));
        const node = pdaValueNode(pdaLinkNode('testPda'));

        const expectedPda = await getProgramDerivedAddress({
            programAddress: testProgramAddress,
            seeds: [getUtf8Codec().encode('prefix')],
        });

        const visitor = makeVisitor({ root });
        const result = await visitor.visitPdaValue(node);
        expect(result).toBe(expectedPda[0]);
    });

    test('should derive PDA with variable seed from argument', async () => {
        const ownerAddress = await SvmTestContext.generateAddress();
        const pda = pdaNode({
            name: 'testPda',
            seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())],
        });
        const root = rootNode(programNode({ name: 'test', pdas: [pda], publicKey: testProgramAddress }));
        const node = pdaValueNode(pdaLinkNode('testPda'), [pdaSeedValueNode('owner', argumentValueNode('ownerArg'))]);
        const ixNode = {
            ...ixNodeStub,
            arguments: [instructionArgumentNode({ name: 'ownerArg', type: publicKeyTypeNode() })],
        };

        const expectedPda = await getProgramDerivedAddress({
            programAddress: testProgramAddress,
            seeds: [getAddressEncoder().encode(ownerAddress)],
        });

        const visitor = makeVisitor({
            argumentsInput: { ownerArg: ownerAddress },
            ixNode,
            root,
        });
        const result = await visitor.visitPdaValue(node);
        expect(result).toBe(expectedPda[0]);
    });

    test('should throw when variable seed value node is missing', async () => {
        const pda = pdaNode({
            name: 'testPda',
            seeds: [variablePdaSeedNode('owner', bytesTypeNode())],
        });
        const root = rootNode(programNode({ name: 'test', pdas: [pda], publicKey: testProgramAddress }));
        const node = pdaValueNode(pdaLinkNode('testPda'));

        const visitor = makeVisitor({ root });
        await expect(visitor.visitPdaValue(node)).rejects.toThrow(/Variable PDA SeedValueNode owner was not found/);
    });
});
