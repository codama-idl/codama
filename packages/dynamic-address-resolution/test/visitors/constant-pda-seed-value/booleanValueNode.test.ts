import { getBooleanCodec } from '@solana/codecs';
import { booleanValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeConstantVisitor } from './constant-pda-seed-value-test-utils';

describe('constant-pda-seed-value: visitBooleanValue', () => {
    test('should encode true', async () => {
        const result = await makeConstantVisitor().visitBooleanValue(booleanValueNode(true));
        expect(result).toEqual(getBooleanCodec().encode(true));
    });

    test('should encode false', async () => {
        const result = await makeConstantVisitor().visitBooleanValue(booleanValueNode(false));
        expect(result).toEqual(getBooleanCodec().encode(false));
    });
});
