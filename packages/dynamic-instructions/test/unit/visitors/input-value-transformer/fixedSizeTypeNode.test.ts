import { bytesTypeNode, fixedSizeTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('fixedSizeTypeNode', () => {
    test('should delegate to inner type (bytes transform visible)', () => {
        const transformer = createInputValueTransformer(fixedSizeTypeNode(bytesTypeNode(), 4), rootNodeMock, {
            bytesEncoding: 'base16',
        });
        const input = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
        expect(transformer(input)).toEqual(['base16', 'deadbeef']);
    });
});
