import {
    booleanValueNode,
    integerValueNode,
    mapEntryValueNode,
    mapValueNode,
    stringValueNode,
    tupleValueNode,
} from '@codama/nodes';
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

test('it resolves map value nodes with non-string keys using the key strings of decoded maps', () => {
    const node = mapValueNode([
        mapEntryValueNode(integerValueNode('5'), integerValueNode('1')),
        mapEntryValueNode(booleanValueNode(true), integerValueNode('2')),
        mapEntryValueNode(tupleValueNode([integerValueNode('1'), stringValueNode('a')]), integerValueNode('3')),
    ]);
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual({ 5: 1n, '[1,"a"]': 3n, true: 2n });
});
