import { getUtf8Codec } from '@solana/codecs';
import { stringValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeConstantVisitor } from './constant-pda-seed-value-test-utils';

describe('constant-pda-seed-value: visitStringValue', () => {
    test('should encode non-empty string as UTF-8 bytes', async () => {
        const result = await makeConstantVisitor().visitStringValue(stringValueNode('hello'));
        expect(result).toEqual(getUtf8Codec().encode('hello'));
    });

    test('should encode empty string as empty bytes', async () => {
        const result = await makeConstantVisitor().visitStringValue(stringValueNode(''));
        expect(result).toEqual(getUtf8Codec().encode(''));
    });
});
