import { numberValueNode, stringValueNode, structFieldValueNode, structValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it returns struct values as objects', () => {
    const node = structValueNode([
        structFieldValueNode('firstname', stringValueNode('John')),
        structFieldValueNode('age', numberValueNode(42)),
    ]);
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual({ age: 42, firstname: 'John' });
});
