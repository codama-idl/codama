import { instructionAccountNode, instructionNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { generateSignerTypes, getInstructionSignerRef } from '../../src/codegen/generate-signer-types';
import { makeRoot } from '../_setup';

describe('generateSignerTypes', () => {
    test('should generate Signers type when isSigner: "either" exists', () => {
        const root = makeRoot([
            instructionNode({
                accounts: [
                    instructionAccountNode({ identifier: 'authority', isSigner: 'either', isWritable: false }),
                    instructionAccountNode({ identifier: 'source', isSigner: false, isWritable: true }),
                ],
                identifier: 'transfer',
            }),
        ]);
        const output = generateSignerTypes(root);
        expect(output).toContain("export type TransferSigners = ('authority')[];");
    });

    test('should not generate Signers block when there are no isSigner: "either" accounts', () => {
        const root = makeRoot([
            instructionNode({
                accounts: [instructionAccountNode({ identifier: 'payer', isSigner: true, isWritable: true })],
                identifier: 'noEither',
            }),
        ]);
        const output = generateSignerTypes(root);
        expect(output).not.toContain('NoEitherSigners');
    });
});

describe('getInstructionSignerRef', () => {
    test('should return ${Name}Signers when an account has isSigner: "either"', () => {
        const ix = instructionNode({
            accounts: [instructionAccountNode({ identifier: 'authority', isSigner: 'either', isWritable: false })],
            identifier: 'transfer',
        });
        const ref = getInstructionSignerRef(ix);
        expect(ref.signersRef).toBe('TransferSigners');
        expect(ref.hasEitherSigners).toBe(true);
    });

    test('should return null signersRef when no account has isSigner: "either"', () => {
        const ix = instructionNode({
            accounts: [instructionAccountNode({ identifier: 'payer', isSigner: true, isWritable: true })],
            identifier: 'pay',
        });
        const ref = getInstructionSignerRef(ix);
        expect(ref.signersRef).toBeNull();
        expect(ref.hasEitherSigners).toBe(false);
    });
});
