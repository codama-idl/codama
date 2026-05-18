import { bytesTypeNode, bytesValueNode, constantValueNode, sentinelTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('sentinelTypeNode', () => {
    test('should delegate to inner type', () => {
        const transformer = createCodecInputTransformer(
            sentinelTypeNode(bytesTypeNode(), constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ff'))),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        const input = new Uint8Array([0xab, 0xcd]);
        expect(transformer(input)).toEqual(['base16', 'abcd']);
    });
});
