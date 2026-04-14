import { bytesTypeNode, remainderOptionTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('remainderOptionTypeNode', () => {
    test('should pass through null and undefined', () => {
        const transformer = createInputValueTransformer(remainderOptionTypeNode(bytesTypeNode()), rootNodeMock);
        expect(transformer(null)).toBe(null);
        expect(transformer(undefined)).toBe(undefined);
    });

    test('should transform non-null inner value', () => {
        const transformer = createInputValueTransformer(remainderOptionTypeNode(bytesTypeNode()), rootNodeMock, {
            bytesEncoding: 'base16',
        });
        expect(transformer(new Uint8Array([0xab]))).toEqual(['base16', 'ab']);
    });
});
