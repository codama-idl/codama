import { bytesTypeNode, numberTypeNode, tupleTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('tupleTypeNode', () => {
    test('should transform each item by position', () => {
        const transformer = createInputValueTransformer(
            tupleTypeNode([numberTypeNode('u8'), bytesTypeNode()]),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        const input = [42, new Uint8Array([0xff])];
        expect(transformer(input)).toEqual([42, ['base16', 'ff']]);
    });

    test('should throw for non-array input', () => {
        const transformer = createInputValueTransformer(tupleTypeNode([numberTypeNode('u8')]), rootNodeMock);
        expect(() => transformer('not an array')).toThrow('Expected an array for tupleTypeNode');
    });

    test('should throw for wrong length', () => {
        const transformer = createInputValueTransformer(
            tupleTypeNode([numberTypeNode('u8'), numberTypeNode('u16')]),
            rootNodeMock,
        );
        expect(() => transformer([1])).toThrow('Expected tuple of length 2');
        expect(() => transformer([1, 2, 3])).toThrow('Expected tuple of length 2');
    });
});
