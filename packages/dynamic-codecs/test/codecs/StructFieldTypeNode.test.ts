import { integerTypeNode, integerValueNode, structFieldTypeNode } from '@codama/nodes';
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
