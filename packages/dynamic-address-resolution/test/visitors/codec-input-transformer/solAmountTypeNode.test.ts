import { numberTypeNode, solAmountTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('solAmountTypeNode', () => {
    test('should delegate to inner number type (pass-through)', () => {
        const transformer = createCodecInputTransformer(solAmountTypeNode(numberTypeNode('u64')), rootNodeMock);
        expect(transformer(1000000000)).toBe(1000000000);
        expect(transformer(0)).toBe(0);
    });
});
