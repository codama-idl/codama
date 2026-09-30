import { expect, test } from 'vitest';

import { accountNode, integerTypeNode, structFieldTypeNode, structTypeNode } from '../src';

test('it returns the right node kind', () => {
    const node = accountNode({ identifier: 'foo' });
    expect(node.kind).toBe('accountNode');
});

test('it returns a frozen object', () => {
    const node = accountNode({ identifier: 'foo' });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it defaults the data to an empty struct', () => {
    const node = accountNode({ identifier: 'foo' });
    expect(node.data).toEqual(structTypeNode([]));
});

test('it keeps the provided data', () => {
    const data = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]);
    const node = accountNode({ data, identifier: 'foo' });
    expect(node.data).toBe(data);
});

test('it preserves the identifier casing', () => {
    const node = accountNode({ identifier: 'MyAccount' });
    expect(node.identifier).toBe('MyAccount');
});
