import { amountTypeNode, numberTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('amountTypeNode', () => {
    test('should delegate to inner number type (pass-through)', () => {
        const transformer = createCodecInputTransformer(amountTypeNode(numberTypeNode('u64'), 2, 'USD'), rootNodeMock);
        expect(transformer(100)).toBe(100);
        expect(transformer(0)).toBe(0);
    });
});
