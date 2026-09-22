import { expect, test } from 'vitest';

import { integerTypeNode, integerValueNode, structFieldTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u8') });
    expect(node.kind).toBe('structFieldTypeNode');
});

test('it returns a frozen object', () => {
    const node = structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u8') });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it preserves the identifier casing', () => {
    const node = structFieldTypeNode({ identifier: 'my_field', type: integerTypeNode('u8') });
    expect(node.identifier).toBe('my_field');
});

test('it can have a default value and strategy', () => {
    const node = structFieldTypeNode({
        defaultValue: integerValueNode('42'),
        defaultValueStrategy: 'omitted',
        identifier: 'age',
        type: integerTypeNode('u8'),
    });
    expect(node.defaultValue).toEqual(integerValueNode('42'));
    expect(node.defaultValueStrategy).toBe('omitted');
});

test('it can have single-string documentation', () => {
    const node = structFieldTypeNode({ docs: 'The age.', identifier: 'age', type: integerTypeNode('u8') });
    expect(node.docs).toBe('The age.');
});
