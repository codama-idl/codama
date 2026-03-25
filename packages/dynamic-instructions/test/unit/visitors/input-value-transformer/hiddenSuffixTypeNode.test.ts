import { bytesTypeNode, bytesValueNode, constantValueNode, hiddenSuffixTypeNode, numberTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('hiddenSuffixTypeNode', () => {
    test('should delegate to inner type', () => {
        const transformer = createInputValueTransformer(
            hiddenSuffixTypeNode(bytesTypeNode(), [constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ff'))]),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        const input = new Uint8Array([0x01, 0x02]);
        expect(transformer(input)).toEqual(['base16', '0102']);
    });

    test('should delegate to inner type [numberTypeNode]', () => {
        const transformer = createInputValueTransformer(
            hiddenSuffixTypeNode(numberTypeNode('u32'), [
                constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ffff')),
            ]),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        expect(transformer(42)).toEqual(42);
    });
});
