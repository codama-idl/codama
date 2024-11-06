import { booleanValueNode, numberValueNode, stringValueNode, tupleValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it returns the tuple as an array of values', () => {
    const node = tupleValueNode([numberValueNode(42), stringValueNode('Hello'), booleanValueNode(true)]);
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual([42, 'Hello', true]);
});
