import { numberValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { AccountError } from '../../../../src/shared/errors';
import { makeVisitor } from './pda-seed-value-test-utils';

describe('pda-seed-value: visitNumberValue', () => {
    test('should encode 0 as single byte', async () => {
        const result = await makeVisitor().visitNumberValue(numberValueNode(0));
        expect(result).toEqual(new Uint8Array([0]));
    });

    test('should encode 255 as single byte', async () => {
        const result = await makeVisitor().visitNumberValue(numberValueNode(255));
        expect(result).toEqual(new Uint8Array([255]));
    });

    test('should throw for value > 255', async () => {
        await expect(makeVisitor().visitNumberValue(numberValueNode(256))).rejects.toThrow(
            /cannot be encoded as a single byte/,
        );
    });

    test('should throw for negative value', async () => {
        await expect(makeVisitor().visitNumberValue(numberValueNode(-1))).rejects.toThrow(AccountError);
    });

    test('should throw for non-integer value', async () => {
        await expect(makeVisitor().visitNumberValue(numberValueNode(1.5))).rejects.toThrow(
            /cannot be encoded as a single byte/,
        );
    });

    test('should throw for large value', async () => {
        await expect(makeVisitor().visitNumberValue(numberValueNode(70000))).rejects.toThrow(
            /cannot be encoded as a single byte/,
        );
    });
});
