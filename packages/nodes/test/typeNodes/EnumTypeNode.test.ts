import { expect, test } from 'vitest';

import {
    enumTypeNode,
    enumVariantTypeNode,
    integerTypeNode,
    isDataEnum,
    isScalarEnum,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '../../src';

test('it returns the right node kind', () => {
    const node = enumTypeNode([]);
    expect(node.kind).toBe('enumTypeNode');
});

test('it returns a frozen object', () => {
    const node = enumTypeNode([]);
    expect(Object.isFrozen(node)).toBe(true);
});

test('it defaults the size to a u8', () => {
    const node = enumTypeNode([]);
    expect(node.size).toEqual(integerTypeNode('u8'));
});

test('it omits variants when the array is empty', () => {
    const node = enumTypeNode([]);
    expect('variants' in node).toBe(false);
});

test('it keeps the provided variants and size', () => {
    const variants = [enumVariantTypeNode('apple'), enumVariantTypeNode('banana')];
    const node = enumTypeNode(variants, { size: integerTypeNode('u32') });
    expect(node.variants).toEqual(variants);
    expect(node.size).toEqual(integerTypeNode('u32'));
});

test('it identifies scalar enums as those whose variants carry no data', () => {
    const scalar = enumTypeNode([enumVariantTypeNode('apple'), enumVariantTypeNode('banana')]);
    expect(isScalarEnum(scalar)).toBe(true);
    expect(isDataEnum(scalar)).toBe(false);
});

test('it identifies data enums as those with at least one variant carrying data', () => {
    const data = enumTypeNode([
        enumVariantTypeNode('unit'),
        enumVariantTypeNode('tuple', { data: tupleTypeNode([integerTypeNode('u8')]) }),
        enumVariantTypeNode('struct', {
            data: structTypeNode([structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u8') })]),
        }),
    ]);
    expect(isScalarEnum(data)).toBe(false);
    expect(isDataEnum(data)).toBe(true);
});
