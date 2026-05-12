import { bytesTypeNode, numberTypeNode, optionTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('optionTypeNode', () => {
    test('should pass through null and undefined', () => {
        const transformer = createCodecInputTransformer(
            optionTypeNode(numberTypeNode('u8'), { prefix: numberTypeNode('u8') }),
            rootNodeMock,
        );
        expect(transformer(null)).toBe(null);
        expect(transformer(undefined)).toBe(undefined);
    });

    test('should transform non-null inner value', () => {
        const transformer = createCodecInputTransformer(
            optionTypeNode(bytesTypeNode(), { prefix: numberTypeNode('u8') }),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        expect(transformer(new Uint8Array([0xff]))).toEqual(['base16', 'ff']);
    });
});
