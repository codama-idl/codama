import { getUtf8Codec } from '@solana/codecs';
import { constantValueNode, mapValueNode, numberTypeNode, stringTypeNode, stringValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { CONSTANT_PDA_SEED_VALUE_SUPPORTED_NODE_KINDS } from '../../../src/visitors/pda-seed-value';
import { makeConstantVisitor } from './constant-pda-seed-value-test-utils';

describe('constant-pda-seed-value: visitConstantValue', () => {
    test('should delegate to inner stringValueNode', async () => {
        const node = constantValueNode(stringTypeNode('utf8'), stringValueNode('Hello world'));
        const result = await makeConstantVisitor().visitConstantValue(node);
        expect(result).toEqual(getUtf8Codec().encode('Hello world'));
    });

    test('should recurse through nested constantValueNodes', async () => {
        const node = constantValueNode(
            stringTypeNode('utf8'),
            constantValueNode(stringTypeNode('utf8'), stringValueNode('Nested hello world')),
        );
        const result = await makeConstantVisitor().visitConstantValue(node);
        expect(result).toEqual(getUtf8Codec().encode('Nested hello world'));
    });

    test('should throw for unsupported inner node kind via fallback', async () => {
        const node = constantValueNode(numberTypeNode('u8'), mapValueNode([]));
        await expect(makeConstantVisitor().visitConstantValue(node)).rejects.toThrow(
            `Expected node of kind [${CONSTANT_PDA_SEED_VALUE_SUPPORTED_NODE_KINDS.join(',')}], got [mapValueNode]`,
        );
    });
});
