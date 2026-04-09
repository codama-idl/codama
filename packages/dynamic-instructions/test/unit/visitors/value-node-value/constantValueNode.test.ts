import { accountValueNode, constantValueNode, numberTypeNode, numberValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { VALUE_NODE_SUPPORTED_NODE_KINDS } from '../../../../src/instruction-encoding/visitors/value-node-value';
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
        ).toThrow(`Expected node of kind [${VALUE_NODE_SUPPORTED_NODE_KINDS.join(',')}], got [accountValueNode]`);
    });
});
