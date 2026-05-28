import { instructionAccountNode, instructionNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { collectEitherSignerNames } from '../../src/codegen/collect-either-signer-names';

describe('collectEitherSignerNames', () => {
    test('should return the names of accounts with isSigner: "either"', () => {
        const ix = instructionNode({
            accounts: [
                instructionAccountNode({ isSigner: 'either', isWritable: false, name: 'authority' }),
                instructionAccountNode({ isSigner: true, isWritable: true, name: 'payer' }),
                instructionAccountNode({ isSigner: 'either', isWritable: false, name: 'delegate' }),
            ],
            arguments: [],
            name: 'transfer',
        });
        expect(collectEitherSignerNames(ix)).toEqual(['authority', 'delegate']);
    });

    test('should return an empty array when no account is isSigner: "either"', () => {
        const ix = instructionNode({
            accounts: [instructionAccountNode({ isSigner: true, isWritable: true, name: 'payer' })],
            arguments: [],
            name: 'pay',
        });
        expect(collectEitherSignerNames(ix)).toEqual([]);
    });
});
