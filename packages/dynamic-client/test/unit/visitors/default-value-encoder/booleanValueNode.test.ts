import { getBooleanCodec } from '@solana/codecs';
import { booleanTypeNode, booleanValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './default-value-encoder-test-utils';

describe('default-value-encoder: visitBooleanValue', () => {
    test('should encode true', () => {
        const visitor = makeVisitor(booleanTypeNode());
        const result = visitor.visitBooleanValue(booleanValueNode(true));
        expect(result).toEqual(getBooleanCodec().encode(true));
    });

    test('should encode false', () => {
        const visitor = makeVisitor(booleanTypeNode());
        const result = visitor.visitBooleanValue(booleanValueNode(false));
        expect(result).toEqual(getBooleanCodec().encode(false));
    });
});
