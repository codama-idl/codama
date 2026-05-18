import { bytesTypeNode, preOffsetTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('preOffsetTypeNode', () => {
    test('should delegate to inner type', () => {
        const transformer = createCodecInputTransformer(preOffsetTypeNode(bytesTypeNode(), 0), rootNodeMock, {
            bytesEncoding: 'base16',
        });
        const input = new Uint8Array([0xab, 0xcd]);
        expect(transformer(input)).toEqual(['base16', 'abcd']);
    });
});
