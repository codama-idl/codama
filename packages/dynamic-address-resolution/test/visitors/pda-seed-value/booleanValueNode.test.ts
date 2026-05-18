import { getBooleanCodec } from '@solana/codecs';
import { booleanValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './pda-seed-value-test-utils';

describe('pda-seed-value: visitBooleanValue', () => {
    test('should encode true', async () => {
        const result = await makeVisitor().visitBooleanValue(booleanValueNode(true));
        expect(result).toEqual(getBooleanCodec().encode(true));
    });

    test('should encode false', async () => {
        const result = await makeVisitor().visitBooleanValue(booleanValueNode(false));
        expect(result).toEqual(getBooleanCodec().encode(false));
    });
});
