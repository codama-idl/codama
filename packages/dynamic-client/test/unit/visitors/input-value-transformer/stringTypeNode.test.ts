import { stringTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('stringTypeNode', () => {
    test('should pass through string values', () => {
        const transformer = createInputValueTransformer(stringTypeNode('utf8'), rootNodeMock);
        expect(transformer('hello')).toBe('hello');
        expect(transformer('')).toBe('');
        expect(transformer('🎉 unicode')).toBe('🎉 unicode');
    });

    test('should pass through non-string values unchanged', () => {
        const transformer = createInputValueTransformer(stringTypeNode('utf8'), rootNodeMock);
        expect(transformer(42)).toBe(42);
        expect(transformer(null)).toBe(null);
    });
});
