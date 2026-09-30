import { integerValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it returns the integer as a bigint', () => {
    const result = visit(integerValueNode('42'), getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toBe(42n);
});

test('it keeps the precision of large integers', () => {
    const result = visit(integerValueNode('18446744073709551615'), getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toBe(18446744073709551615n);
});
