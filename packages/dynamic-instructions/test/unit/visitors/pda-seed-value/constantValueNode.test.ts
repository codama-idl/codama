import { getUtf8Codec } from '@solana/codecs';
import { constantValueNode, mapValueNode, numberTypeNode, stringTypeNode, stringValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './pda-seed-value-test-utils';

describe('pda-seed-value: visitConstantValue', () => {
    test('should delegate to inner stringValueNode', async () => {
        const node = constantValueNode(stringTypeNode('utf8'), stringValueNode('Hello world'));
        const result = await makeVisitor().visitConstantValue(node);
        expect(result).toEqual(getUtf8Codec().encode('Hello world'));
    });

    test('should delegate to nested inner constantValueNode', async () => {
        const node = constantValueNode(
            stringTypeNode('utf8'),
            constantValueNode(stringTypeNode('utf8'), stringValueNode('Nested hello world')),
        );
        const result = await makeVisitor().visitConstantValue(node);
        expect(result).toEqual(getUtf8Codec().encode('Nested hello world'));
    });

    test('should throw for unsupported inner node kind', async () => {
        const node = constantValueNode(numberTypeNode('u8'), mapValueNode([]));
        await expect(makeVisitor().visitConstantValue(node)).rejects.toThrow(/Unsupported constant PDA seed value/);
    });
});
