import { accountValueNode, booleanValueNode, numberValueNode, stringValueNode, tupleValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { VALUE_NODE_SUPPORTED_NODE_KINDS } from '../../../../src/instruction-encoding/visitors/value-node-value';
import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitTupleValue', () => {
    test('should resolve mixed-type tuple items', () => {
        const result = makeVisitor().visitTupleValue(
            tupleValueNode([numberValueNode(1), stringValueNode('a'), booleanValueNode(true)]),
        );
        expect(result).toEqual({
            kind: 'tupleValueNode',
            value: [
                { kind: 'numberValueNode', value: 1 },
                { kind: 'stringValueNode', value: 'a' },
                { kind: 'booleanValueNode', value: true },
            ],
        });
    });

    test('should throw for unsupported inner node', () => {
        expect(() =>
            makeVisitor().visitTupleValue(
                // @ts-expect-error - accountValueNode is invalid as a StandaloneValueNode
                tupleValueNode([accountValueNode('test')]),
            ),
        ).toThrow(`Expected node of kind [${VALUE_NODE_SUPPORTED_NODE_KINDS.join(',')}], got [accountValueNode]`);
    });
});
