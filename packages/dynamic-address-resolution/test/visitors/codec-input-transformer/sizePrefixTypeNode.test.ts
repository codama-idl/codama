import { bytesTypeNode, numberTypeNode, sizePrefixTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('sizePrefixTypeNode', () => {
    test('should delegate to inner type', () => {
        const transformer = createCodecInputTransformer(
            sizePrefixTypeNode(bytesTypeNode(), numberTypeNode('u32')),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        const input = new Uint8Array([0x01, 0x02]);
        expect(transformer(input)).toEqual(['base16', '0102']);
    });
});
