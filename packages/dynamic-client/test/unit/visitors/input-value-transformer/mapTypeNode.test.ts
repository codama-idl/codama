import { bytesTypeNode, mapTypeNode, numberTypeNode, prefixedCountNode, stringTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('mapTypeNode', () => {
    test('should transform map values with bytes inner type', () => {
        const transformer = createInputValueTransformer(
            mapTypeNode(stringTypeNode('utf8'), bytesTypeNode(), prefixedCountNode(numberTypeNode('u32'))),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        const input = { key1: new Uint8Array([0x01]), key2: new Uint8Array([0x02]) };
        expect(transformer(input)).toEqual({ key1: ['base16', '01'], key2: ['base16', '02'] });
    });

    test('should pass through map with primitive values', () => {
        const transformer = createInputValueTransformer(
            mapTypeNode(stringTypeNode('utf8'), numberTypeNode('u64'), prefixedCountNode(numberTypeNode('u32'))),
            rootNodeMock,
        );
        expect(transformer({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    });

    test('should throw for non-object input', () => {
        const transformer = createInputValueTransformer(
            mapTypeNode(stringTypeNode('utf8'), numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32'))),
            rootNodeMock,
        );
        expect(() => transformer('not an object')).toThrow(/Expected \[object\] for \[mapTypeNode\]/);
        expect(() => transformer([1, 2])).toThrow(/Expected \[object\] for \[mapTypeNode\]/);
    });
});
