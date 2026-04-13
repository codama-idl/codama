import { bytesTypeNode, bytesValueNode, constantValueNode, sentinelTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('sentinelTypeNode', () => {
    test('should delegate to inner type', () => {
        const transformer = createInputValueTransformer(
            sentinelTypeNode(bytesTypeNode(), constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'ff'))),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );
        const input = new Uint8Array([0xab, 0xcd]);
        expect(transformer(input)).toEqual(['base16', 'abcd']);
    });
});
