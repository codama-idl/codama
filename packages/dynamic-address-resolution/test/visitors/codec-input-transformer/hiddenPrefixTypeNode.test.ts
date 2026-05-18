import {
    bytesTypeNode,
    bytesValueNode,
    constantValueNode,
    fixedSizeTypeNode,
    hiddenPrefixTypeNode,
    numberTypeNode,
    stringTypeNode,
    stringValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('hiddenPrefixTypeNode', () => {
    test('should delegate to inner type [bytesTypeNode]', () => {
        const transformer = createCodecInputTransformer(
            hiddenPrefixTypeNode(bytesTypeNode(), [constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ff'))]),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        const input = new Uint8Array([0x01, 0x02]);
        expect(transformer(input)).toEqual(['base16', '0102']);
    });

    test('should delegate to inner type [numberTypeNode]', () => {
        const transformer = createCodecInputTransformer(
            hiddenPrefixTypeNode(numberTypeNode('u32'), [
                constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ffff')),
            ]),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        expect(transformer(42)).toEqual(42);
    });

    test('should delegate to inner type [stringTypeNode]', () => {
        const transformer = createCodecInputTransformer(
            hiddenPrefixTypeNode(fixedSizeTypeNode(stringTypeNode('utf8'), 10), [
                constantValueNode(stringTypeNode('utf8'), stringValueNode('Hello')),
            ]),
            rootNodeMock,
        );
        expect(transformer('World')).toEqual('World');
    });
});
