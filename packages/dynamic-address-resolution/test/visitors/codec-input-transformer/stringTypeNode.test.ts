import { stringTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('stringTypeNode', () => {
    test('should pass through string values', () => {
        const transformer = createCodecInputTransformer(stringTypeNode('utf8'), rootNodeMock);
        expect(transformer('hello')).toBe('hello');
        expect(transformer('')).toBe('');
        expect(transformer('🎉 unicode')).toBe('🎉 unicode');
    });

    test('should pass through non-string values unchanged', () => {
        const transformer = createCodecInputTransformer(stringTypeNode('utf8'), rootNodeMock);
        expect(transformer(42)).toBe(42);
        expect(transformer(null)).toBe(null);
    });
});
