import { getAddressEncoder } from '@solana/addresses';
import { programIdValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './pda-seed-value-test-utils';

describe('pda-seed-value: visitProgramIdValue', () => {
    test('should encode the context programId as 32-byte address', async () => {
        const svm = new SvmTestContext();
        const randomAddress = await svm.createAccount();
        const result = await makeVisitor({
            programId: randomAddress,
        }).visitProgramIdValue(programIdValueNode());
        expect(result).toEqual(getAddressEncoder().encode(randomAddress));
    });

    test('should throw an error for non-string programId', async () => {
        const invalidValues = [42, [1, 2, 3], null];
        for (const value of invalidValues) {
            // @ts-expect-error testing invalid programId value
            const visitor = makeVisitor({ programId: value });
            await expect(visitor.visitProgramIdValue(programIdValueNode())).rejects.toThrow(
                /Expected base58-encoded Address/,
            );
        }
    });

    test('should throw an error for invalid string programId', async () => {
        const invalidValues = ['not-a-key', '123', '', '      '];
        for (const value of invalidValues) {
            // @ts-expect-error testing invalid programId value
            const visitor = makeVisitor({ programId: value });
            await expect(visitor.visitProgramIdValue(programIdValueNode())).rejects.toThrow(
                /Expected base58-encoded Address/,
            );
        }
    });
});
