import { amountTypeNode, numberTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('amountTypeNode', () => {
    test('should delegate to inner number type (pass-through)', () => {
        const transformer = createInputValueTransformer(amountTypeNode(numberTypeNode('u64'), 2, 'USD'), rootNodeMock);
        expect(transformer(100)).toBe(100);
        expect(transformer(0)).toBe(0);
    });
});
