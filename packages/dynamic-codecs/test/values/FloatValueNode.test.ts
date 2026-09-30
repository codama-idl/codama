import { floatValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it returns the float as a number', () => {
    const result = visit(floatValueNode('1.5'), getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toBe(1.5);
});
