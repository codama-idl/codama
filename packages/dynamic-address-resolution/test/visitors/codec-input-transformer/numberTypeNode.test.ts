import { numberTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('numberTypeNode', () => {
    test('should pass through number values', () => {
        const transformer = createCodecInputTransformer(numberTypeNode('u64'), rootNodeMock);
        expect(transformer(0)).toBe(0);
        expect(transformer(42)).toBe(42);
        expect(transformer(999)).toBe(999);
        expect(transformer(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    });
});
