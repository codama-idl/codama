import { arrayTypeNode, bytesTypeNode, numberTypeNode, prefixedCountNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('arrayTypeNode', () => {
    test('should transform array items with bytes inner type', () => {
        const transformer = createInputValueTransformer(
            arrayTypeNode(bytesTypeNode(), prefixedCountNode(numberTypeNode('u32'))),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        const input = [new Uint8Array([0x01]), new Uint8Array([0x02])];
        expect(transformer(input)).toEqual([
            ['base16', '01'],
            ['base16', '02'],
        ]);
    });

    test('should pass through array of primitives', () => {
        const transformer = createInputValueTransformer(
            arrayTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32'))),
            rootNodeMock,
        );
        expect(transformer([1, 2, 3])).toEqual([1, 2, 3]);
    });

    test('should throw for non-array input', () => {
        const transformer = createInputValueTransformer(
            arrayTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32'))),
            rootNodeMock,
        );
        expect(() => transformer('not an array')).toThrow('Expected an array for arrayTypeNode');
        expect(() => transformer(42)).toThrow('Expected an array for arrayTypeNode');
    });
});
