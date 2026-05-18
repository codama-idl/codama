import { noneValueNode, numberTypeNode, optionTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './default-value-encoder-test-utils';

describe('default-value-encoder: visitNoneValue', () => {
    test('should encode none as option prefix byte 0', () => {
        const visitor = makeVisitor(optionTypeNode(numberTypeNode('u8')));
        const result = visitor.visitNoneValue(noneValueNode());
        expect(result).toEqual(new Uint8Array([0]));
    });
});
