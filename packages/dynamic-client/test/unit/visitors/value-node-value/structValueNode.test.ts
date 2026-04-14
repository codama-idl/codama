import { accountValueNode, numberValueNode, stringValueNode, structFieldValueNode, structValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { VALUE_NODE_SUPPORTED_NODE_KINDS } from '../../../../src/instruction-encoding/visitors/value-node-value';
import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitStructValue', () => {
    test('should resolve struct fields to object entries', () => {
        const result = makeVisitor().visitStructValue(
            structValueNode([
                structFieldValueNode('name', stringValueNode('Alice')),
                structFieldValueNode('age', numberValueNode(30)),
            ]),
        );
        expect(result).toEqual({
            kind: 'structValueNode',
            value: {
                age: { kind: 'numberValueNode', value: 30 },
                name: { kind: 'stringValueNode', value: 'Alice' },
            },
        });
    });

    test('should throw for unsupported field value', () => {
        expect(() =>
            makeVisitor().visitStructValue(
                // @ts-expect-error - accountValueNode is invalid as a StandaloneValueNode
                structValueNode([structFieldValueNode('invalid_field', accountValueNode('test'))]),
            ),
        ).toThrow(`Expected node of kind [${VALUE_NODE_SUPPORTED_NODE_KINDS.join(',')}], got [accountValueNode]`);
    });
});
