import { instructionAccountNode, instructionNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { collectEitherSignerNames } from '../../src/codegen/collect-either-signer-names';

describe('collectEitherSignerNames', () => {
    test('should return the names of accounts with isSigner: "either"', () => {
        const ix = instructionNode({
            accounts: [
                instructionAccountNode({ identifier: 'authority', isSigner: 'either', isWritable: false }),
                instructionAccountNode({ identifier: 'payer', isSigner: true, isWritable: true }),
                instructionAccountNode({ identifier: 'delegate', isSigner: 'either', isWritable: false }),
            ],
            identifier: 'transfer',
        });
        expect(collectEitherSignerNames(ix)).toEqual(['authority', 'delegate']);
    });

    test('should return an empty array when no account is isSigner: "either"', () => {
        const ix = instructionNode({
            accounts: [instructionAccountNode({ identifier: 'payer', isSigner: true, isWritable: true })],
            identifier: 'pay',
        });
        expect(collectEitherSignerNames(ix)).toEqual([]);
    });
});
