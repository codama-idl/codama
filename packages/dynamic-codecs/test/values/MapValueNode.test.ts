import { integerValueNode, mapEntryValueNode, mapValueNode, stringValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it resolves map value nodes as objects', () => {
    const node = mapValueNode([
        mapEntryValueNode(stringValueNode('foo'), integerValueNode('1')),
        mapEntryValueNode(stringValueNode('bar'), integerValueNode('2')),
        mapEntryValueNode(stringValueNode('baz'), integerValueNode('3')),
    ]);
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual({ bar: 2n, baz: 3n, foo: 1n });
});
