import { accountValueNode, arrayValueNode, numberValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitArrayValue', () => {
    test('should resolve empty array', () => {
        const result = makeVisitor().visitArrayValue(arrayValueNode([]));
        expect(result).toEqual({ kind: 'arrayValueNode', value: [] });
    });

    test('should resolve array items recursively', () => {
        const result = makeVisitor().visitArrayValue(arrayValueNode([numberValueNode(1), numberValueNode(2)]));
        expect(result).toEqual({
            kind: 'arrayValueNode',
            value: [
                { kind: 'numberValueNode', value: 1 },
                { kind: 'numberValueNode', value: 2 },
            ],
        });
    });

    test('should throw for unsupported inner node', () => {
        expect(() =>
            makeVisitor().visitArrayValue(
                // @ts-expect-error - accountValueNode is invalid
                arrayValueNode([accountValueNode('test')]),
            ),
        ).toThrow(/Cannot resolve array item/);
    });
});
