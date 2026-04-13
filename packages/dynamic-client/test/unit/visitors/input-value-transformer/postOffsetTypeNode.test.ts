import { bytesTypeNode, numberTypeNode, postOffsetTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('postOffsetTypeNode', () => {
    test('should delegate to inner type [bytesTypeNode]', () => {
        const transformer = createInputValueTransformer(postOffsetTypeNode(bytesTypeNode(), 0), rootNodeMock, {
            bytesEncoding: 'base16',
        });
        const input = new Uint8Array([0xab, 0xcd]);
        expect(transformer(input)).toEqual(['base16', 'abcd']);
    });

    test('should delegate to inner type [numberTypeNode]', () => {
        const transformer = createInputValueTransformer(postOffsetTypeNode(numberTypeNode('u32'), 0), rootNodeMock);
        expect(transformer(42)).toEqual(42);
    });
});
