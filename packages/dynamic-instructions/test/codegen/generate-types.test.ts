import {
    definedTypeLinkNode,
    definedTypeNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    optionTypeNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { generateTypes } from '../../src/codegen/generate-types';
import { makeRoot } from '../_setup';

describe('generateTypes', () => {
    test('should compose header, instruction blocks, signers, and instruction builders map', () => {
        const root = makeRoot(
            [
                instructionNode({
                    accounts: [
                        instructionAccountNode({ identifier: 'authority', isSigner: 'either', isWritable: false }),
                        instructionAccountNode({ identifier: 'source', isSigner: false, isWritable: true }),
                    ],
                    data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]),
                    identifier: 'transfer',
                }),
            ],
            'token',
        );
        const output = generateTypes(root);
        // Header
        expect(output).toContain('Auto-generated instruction types');
        expect(output).toContain("import type { InstructionsBuilderFn } from '@codama/dynamic-instructions';");
        expect(output).toContain('export type TransferInstructionDataArgs');
        expect(output).toContain('export type TransferAccounts');
        expect(output).toContain("export type TransferSigners = ('authority')[];");
        expect(output).toContain('export type TransferReadsAccountData = false;');
        expect(output).toContain('export type TokenInstructionBuilders');
        expect(output).toContain(
            'transfer: InstructionsBuilderFn<TransferInstructionDataArgs, TransferAccounts, TransferSigners>',
        );
    });

    test('it emits the aliases of the recursive types it references', () => {
        const node = definedTypeNode({
            identifier: 'node',
            type: structTypeNode([
                structFieldTypeNode({ identifier: 'next', type: optionTypeNode(definedTypeLinkNode('node')) }),
            ]),
        });
        const push = instructionNode({ data: definedTypeLinkNode('node'), identifier: 'push' });
        const root = rootNode(
            programNode({ definedTypes: [node], identifier: 'list', instructions: [push], publicKey: '1111' }),
        );

        const output = generateTypes(root);
        expect(output).toContain('export type NodeArgs = { next?: NodeArgs | null };');
        expect(output).toContain('export type PushInstructionDataArgs = { next?: NodeArgs | null };');
    });
});
