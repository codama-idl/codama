import { bytesTypeNode, numberTypeNode, prefixedCountNode, setTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('setTypeNode', () => {
    test('should transform set items with bytes inner type', () => {
        const transformer = createInputValueTransformer(
            setTypeNode(bytesTypeNode(), prefixedCountNode(numberTypeNode('u32'))),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        const input = [new Uint8Array([0xaa]), new Uint8Array([0xbb])];
        expect(transformer(input)).toEqual([
            ['base16', 'aa'],
            ['base16', 'bb'],
        ]);
    });

    test('should throw for non-array input', () => {
        const transformer = createInputValueTransformer(
            setTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32'))),
            rootNodeMock,
        );
        expect(() => transformer('not an array')).toThrow(/Expected \[array\] for \[setTypeNode\]/);
        expect(() => transformer({ a: 1 })).toThrow(/Expected \[array\] for \[setTypeNode\]/);
    });
});
