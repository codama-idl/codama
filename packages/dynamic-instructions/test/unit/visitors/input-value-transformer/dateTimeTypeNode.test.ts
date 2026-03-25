import { dateTimeTypeNode, numberTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('dateTimeTypeNode', () => {
    test('should delegate to inner number type (pass-through)', () => {
        const transformer = createInputValueTransformer(dateTimeTypeNode(numberTypeNode('i64')), rootNodeMock);
        expect(transformer(1700000000)).toBe(1700000000);
        expect(transformer(0)).toBe(0);
    });
});
