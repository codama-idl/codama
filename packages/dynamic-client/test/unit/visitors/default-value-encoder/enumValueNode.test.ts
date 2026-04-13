import { enumEmptyVariantTypeNode, enumTypeNode, enumValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './default-value-encoder-test-utils';

describe('default-value-encoder: visitEnumValue', () => {
    test('should encode variants', () => {
        const visitor = makeVisitor(
            enumTypeNode([enumEmptyVariantTypeNode('variantA'), enumEmptyVariantTypeNode('variantB')]),
        );
        const variantA = visitor.visitEnumValue(enumValueNode('testEnum', 'variantA'));
        expect(variantA).toEqual(new Uint8Array([0]));

        const variantB = visitor.visitEnumValue(enumValueNode('testEnum', 'variantB'));
        expect(variantB).toEqual(new Uint8Array([1]));
    });
});
