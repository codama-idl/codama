import { numberValueNode, setValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it returns an array of all resolved value nodes', () => {
    const node = setValueNode([numberValueNode(1), numberValueNode(2), numberValueNode(3)]);
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual([1, 2, 3]);
});
