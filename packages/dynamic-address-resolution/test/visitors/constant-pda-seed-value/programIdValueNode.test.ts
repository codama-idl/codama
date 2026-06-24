import { getAddressEncoder } from '@solana/addresses';
import { programIdValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { generateAddress } from '../../test-utils';
import { makeConstantVisitor } from './constant-pda-seed-value-test-utils';

describe('constant-pda-seed-value: visitProgramIdValue', () => {
    test('should encode the context programId as 32-byte address', async () => {
        const randomAddress = await generateAddress();
        const result = await makeConstantVisitor({ programId: randomAddress }).visitProgramIdValue(
            programIdValueNode(),
        );
        expect(result).toEqual(getAddressEncoder().encode(randomAddress));
    });
});
