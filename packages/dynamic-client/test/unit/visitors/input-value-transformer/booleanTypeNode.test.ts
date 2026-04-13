import { booleanTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('booleanTypeNode', () => {
    test('should pass through boolean values', () => {
        const transformer = createInputValueTransformer(booleanTypeNode(), rootNodeMock);
        expect(transformer(true)).toBe(true);
        expect(transformer(false)).toBe(false);
    });
});
