import { bytesTypeNode, preOffsetTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('preOffsetTypeNode', () => {
    test('should delegate to inner type', () => {
        const transformer = createInputValueTransformer(preOffsetTypeNode(bytesTypeNode(), 0), rootNodeMock, {
            bytesEncoding: 'base16',
        });
        const input = new Uint8Array([0xab, 0xcd]);
        expect(transformer(input)).toEqual(['base16', 'abcd']);
    });
});
