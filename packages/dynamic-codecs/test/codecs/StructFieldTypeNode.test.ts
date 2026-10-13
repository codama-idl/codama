import { injectedValueNode, integerTypeNode, integerValueNode, structFieldTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes struct fields using their types', () => {
    const codec = getNodeValueCodec([structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u16') })]);
    expect(codec.encode(42)).toStrictEqual(hex('2a00'));
    expect(codec.decode(hex('2a00'))).toBe(42n);
});

test('it encodes the default value of standalone fields when missing', () => {
    const codec = getNodeValueCodec([
        structFieldTypeNode({ defaultValue: integerValueNode('5'), identifier: 'fee', type: integerTypeNode('u16') }),
    ]);
    expect(codec.encode(undefined)).toStrictEqual(hex('0500'));
    expect(codec.encode(9)).toStrictEqual(hex('0900'));
});

test('it always encodes the default value of omitted standalone fields', () => {
    const codec = getNodeValueCodec([
        structFieldTypeNode({
            defaultValue: integerValueNode('3'),
            defaultValueStrategy: 'omitted',
            identifier: 'discriminator',
            type: integerTypeNode('u8'),
        }),
    ]);
    expect(codec.encode(undefined)).toStrictEqual(hex('03'));
    expect(codec.encode(7)).toStrictEqual(hex('03'));
});

test('it encodes resolved default values instead of evaluating them', () => {
    // Given a field whose default value is injected but never provided.
    const field = structFieldTypeNode({
        defaultValue: injectedValueNode({ key: 'decimals' }),
        identifier: 'decimals',
        type: integerTypeNode('u8'),
    });

    // When its default value is resolved beforehand.
    const codec = getNodeValueCodec([field], { resolvedDefaultValues: new Map([[field, 6]]) });

    // Then it encodes the resolved value when missing, and the provided value otherwise.
    expect(codec.encode(undefined)).toStrictEqual(hex('06'));
    expect(codec.encode(9)).toStrictEqual(hex('09'));
});

test('it always encodes the resolved default value of omitted fields', () => {
    const field = structFieldTypeNode({
        defaultValue: injectedValueNode({ key: 'decimals' }),
        defaultValueStrategy: 'omitted',
        identifier: 'decimals',
        type: integerTypeNode('u8'),
    });
    const codec = getNodeValueCodec([field], { resolvedDefaultValues: new Map([[field, 6]]) });
    expect(codec.encode(9)).toStrictEqual(hex('06'));
});

test('it resolves fields with a default value when they have no resolved default value', () => {
    const field = structFieldTypeNode({
        defaultValue: integerValueNode('5'),
        identifier: 'fee',
        type: integerTypeNode('u8'),
    });
    const other = structFieldTypeNode({ identifier: 'other', type: integerTypeNode('u8') });
    const codec = getNodeValueCodec([field], { resolvedDefaultValues: new Map([[other, 6]]) });
    expect(codec.encode(undefined)).toStrictEqual(hex('05'));
});
