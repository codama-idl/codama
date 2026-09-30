import { instructionAccountNode, instructionNode, integerTypeNode, structFieldTypeNode, structTypeNode } from 'codama';
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
        expect(output).toContain('export type TokenInstructionBuilders');
        expect(output).toContain(
            'transfer: InstructionsBuilderFn<TransferInstructionDataArgs, TransferAccounts, TransferSigners>',
        );
    });
});
