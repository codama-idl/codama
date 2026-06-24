import { numberValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeConstantVisitor } from './constant-pda-seed-value-test-utils';

describe('constant-pda-seed-value: visitNumberValue', () => {
    test('should encode valid u8', async () => {
        const result = await makeConstantVisitor().visitNumberValue(numberValueNode(1));
        expect(result).toEqual(new Uint8Array([1]));
    });

    test('should throw for value out of u8 range', async () => {
        await expect(makeConstantVisitor().visitNumberValue(numberValueNode(256))).rejects.toThrow(/out of range/);
    });
});
