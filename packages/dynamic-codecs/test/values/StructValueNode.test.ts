import { integerValueNode, stringValueNode, structFieldValueNode, structValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it returns struct values as objects', () => {
    const node = structValueNode([
        structFieldValueNode('firstname', stringValueNode('John')),
        structFieldValueNode('age', integerValueNode('42')),
    ]);
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual({ age: 42n, firstname: 'John' });
});

test('it uses the raw field identifiers', () => {
    const node = structValueNode([structFieldValueNode('my_field', integerValueNode('42'))]);
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual({ my_field: 42n });
});
