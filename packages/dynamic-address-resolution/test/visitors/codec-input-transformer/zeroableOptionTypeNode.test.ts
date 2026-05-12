import { bytesTypeNode, zeroableOptionTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('zeroableOptionTypeNode', () => {
    test('should pass through null and undefined', () => {
        const transformer = createCodecInputTransformer(zeroableOptionTypeNode(bytesTypeNode()), rootNodeMock);
        expect(transformer(null)).toBe(null);
        expect(transformer(undefined)).toBe(undefined);
    });

    test('should transform non-null inner value', () => {
        const transformer = createCodecInputTransformer(zeroableOptionTypeNode(bytesTypeNode()), rootNodeMock, {
            bytesEncoding: 'base16',
        });
        expect(transformer(new Uint8Array([0xcd]))).toEqual(['base16', 'cd']);
    });
});
