import { accountValueNode, constantValueNode, numberTypeNode, numberValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitConstantValue', () => {
    test('should delegate to inner value node', () => {
        const result = makeVisitor().visitConstantValue(constantValueNode(numberTypeNode('u8'), numberValueNode(255)));
        expect(result).toEqual({ kind: 'numberValueNode', value: 255 });
    });

    test('should throw for unsupported inner node', () => {
        expect(() =>
            makeVisitor().visitConstantValue(
                // @ts-expect-error - accountValueNode is invalid inside constantValueNode
                constantValueNode(numberTypeNode('u8'), accountValueNode('test')),
            ),
        ).toThrow(/Cannot resolve constantValueNode/);
    });
});
