import { booleanValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it returns the boolean as-is', () => {
    const visitor = getValueNodeVisitor(new LinkableDictionary());
    expect(visit(booleanValueNode(true), visitor)).toBe(true);
    expect(visit(booleanValueNode(false), visitor)).toBe(false);
});
