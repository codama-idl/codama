import { dateTimeTypeNode, numberTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('dateTimeTypeNode', () => {
    test('should delegate to inner number type (pass-through)', () => {
        const transformer = createCodecInputTransformer(dateTimeTypeNode(numberTypeNode('i64')), rootNodeMock);
        expect(transformer(1700000000)).toBe(1700000000);
        expect(transformer(0)).toBe(0);
    });
});
