import { mapEntryValueNode, mapValueNode, numberValueNode, stringValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it resolves map value nodes as objects', () => {
    const node = mapValueNode([
        mapEntryValueNode(stringValueNode('foo'), numberValueNode(1)),
        mapEntryValueNode(stringValueNode('bar'), numberValueNode(2)),
        mapEntryValueNode(stringValueNode('baz'), numberValueNode(3)),
    ]);
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual({ bar: 2, baz: 3, foo: 1 });
});
