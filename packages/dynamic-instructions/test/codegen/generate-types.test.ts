import { instructionAccountNode, instructionArgumentNode, instructionNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { generateTypes } from '../../src/codegen/generate-types';
import { makeRoot } from '../test-utils';

describe('generateTypes', () => {
    test('should compose header, instruction blocks, signers, and instruction builders map', () => {
        const root = makeRoot(
            [
                instructionNode({
                    accounts: [
                        instructionAccountNode({ isSigner: 'either', isWritable: false, name: 'authority' }),
                        instructionAccountNode({ isSigner: false, isWritable: true, name: 'source' }),
                    ],
                    arguments: [
                        instructionArgumentNode({
                            name: 'amount',
                            type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                        }),
                    ],
                    name: 'transfer',
                }),
            ],
            'token',
        );
        const output = generateTypes(root);
        // Header
        expect(output).toContain('Auto-generated instruction types');
        expect(output).toContain("import type { InstructionsBuilderFn } from '@codama/dynamic-instructions';");
        expect(output).toContain('export type TransferArgs');
        expect(output).toContain('export type TransferAccounts');
        expect(output).toContain("export type TransferSigners = ('authority')[];");
        expect(output).toContain('export type TokenInstructionBuilders');
        expect(output).toContain('transfer: InstructionsBuilderFn<TransferArgs, TransferAccounts');
    });
});
