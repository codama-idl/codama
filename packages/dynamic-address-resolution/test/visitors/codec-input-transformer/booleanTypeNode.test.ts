import { booleanTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('booleanTypeNode', () => {
    test('should pass through boolean values', () => {
        const transformer = createCodecInputTransformer(booleanTypeNode(), rootNodeMock);
        expect(transformer(true)).toBe(true);
        expect(transformer(false)).toBe(false);
    });
});
