import { numberValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it returns the number as-is', () => {
    const result = visit(numberValueNode(42), getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toBe(42);
});
