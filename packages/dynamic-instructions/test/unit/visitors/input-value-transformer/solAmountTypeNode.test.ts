import { numberTypeNode, solAmountTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('solAmountTypeNode', () => {
    test('should delegate to inner number type (pass-through)', () => {
        const transformer = createInputValueTransformer(solAmountTypeNode(numberTypeNode('u64')), rootNodeMock);
        expect(transformer(1000000000)).toBe(1000000000);
        expect(transformer(0)).toBe(0);
    });
});
