import { instructionAccountNode, instructionNode, integerTypeNode, structFieldTypeNode, structTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { generateInstructionBuildersMap } from '../../src/codegen/generate-instruction-builder';
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
});
