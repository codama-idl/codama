import { bytesTypeNode, numberTypeNode, tupleTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('tupleTypeNode', () => {
    test('should transform each item by position', () => {
        const transformer = createCodecInputTransformer(
            tupleTypeNode([numberTypeNode('u8'), bytesTypeNode()]),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        const input = [42, new Uint8Array([0xff])];
        expect(transformer(input)).toEqual([42, ['base16', 'ff']]);
    });

    test('should throw for non-array input', () => {
        const transformer = createCodecInputTransformer(tupleTypeNode([numberTypeNode('u8')]), rootNodeMock);
        expect(() => transformer('not an array')).toThrow(/Expected \[array\] for \[tupleTypeNode\]/);
    });

    test('should throw for wrong length', () => {
        const transformer = createCodecInputTransformer(
            tupleTypeNode([numberTypeNode('u8'), numberTypeNode('u16')]),
            rootNodeMock,
        );
        expect(() => transformer([1])).toThrow(/Expected \[array\(length:2\)\] for \[tupleTypeNode\]/);
        expect(() => transformer([1, 2, 3])).toThrow(/Expected \[array\(length:2\)\] for \[tupleTypeNode\]/);
    });
});
