import {
    accountDataValueNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import {
    generateInstructionBuildersMap,
    generateReadsAccountDataTypes,
} from '../../src/codegen/generate-instruction-builder';
import { makeRoot } from '../_setup';

describe('generateInstructionBuildersMap', () => {
    test('should generate InstructionBuilders aggregate map type', () => {
        const root = makeRoot(
            [
                instructionNode({
                    accounts: [instructionAccountNode({ identifier: 'source', isSigner: false, isWritable: true })],
                    data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]),
                    identifier: 'transfer',
                }),
                instructionNode({ identifier: 'close' }),
            ],
            'token',
        );
        const output = generateInstructionBuildersMap(root);
        expect(output).toContain('export type TokenInstructionBuilders');
        expect(output).toContain(
            'transfer: InstructionsBuilderFn<TransferInstructionDataArgs, TransferAccounts, string[]>;',
        );
        expect(output).toContain('close: InstructionsBuilderFn<undefined, CloseAccounts, string[]>;');
    });

    test('should flag the instructions reading account data', () => {
        const root = makeRoot(
            [
                instructionNode({
                    accounts: [
                        instructionAccountNode({
                            defaultValue: accountDataValueNode('mint', { path: 'mintAuthority' }),
                            identifier: 'authority',
                            isSigner: false,
                            isWritable: false,
                        }),
                    ],
                    identifier: 'mintTo',
                }),
                instructionNode({ identifier: 'close' }),
            ],
            'token',
        );
        expect(generateReadsAccountDataTypes(root)).toBe(
            'export type MintToReadsAccountData = true;\nexport type CloseReadsAccountData = false;\n\n',
        );
    });
});
