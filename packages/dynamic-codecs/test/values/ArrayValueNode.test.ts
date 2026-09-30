import { arrayValueNode, integerValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it returns an array of all resolved value nodes', () => {
    const node = arrayValueNode([integerValueNode('1'), integerValueNode('2'), integerValueNode('3')]);
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual([1n, 2n, 3n]);
});
