import { instructionAccountNode, instructionArgumentNode, instructionNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { generateInstructionBuildersMap } from '../../src/codegen/generate-instruction-builder';
import { makeRoot } from '../test-utils';

describe('generateInstructionBuildersMap', () => {
    test('should generate InstructionBuilders aggregate map type', () => {
        const root = makeRoot(
            [
                instructionNode({
                    accounts: [instructionAccountNode({ isSigner: false, isWritable: true, name: 'source' })],
                    arguments: [
                        instructionArgumentNode({
                            name: 'amount',
                            type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                        }),
                    ],
                    name: 'transfer',
                }),
                instructionNode({ name: 'close' }),
            ],
            'token',
        );
        const output = generateInstructionBuildersMap(root);
        expect(output).toContain('export type TokenInstructionBuilders');
        expect(output).toContain('transfer: InstructionsBuilderFn<TransferArgs, TransferAccounts, string[]>;');
        expect(output).toContain('close: InstructionsBuilderFn<Record<string, never>, CloseAccounts, string[]>;');
    });
});
