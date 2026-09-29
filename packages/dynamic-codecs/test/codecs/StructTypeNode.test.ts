import {
    bytesTypeNode,
    bytesValueNode,
    fixedSizeTransformNode,
    integerTypeNode,
    integerValueNode,
    optionTypeNode,
    someValueNode,
    stringTypeNode,
    stringValueNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes structs', () => {
    const codec = getNodeValueCodec([
        structTypeNode([
            structFieldTypeNode({
                identifier: 'firstname',
                type: stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(5)] }),
            }),
            structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u16') }),
        ]),
    ]);
    expect(codec.encode({ age: 42, firstname: 'Alice' })).toStrictEqual(hex('416c6963652a00'));
    expect(codec.decode(hex('416c6963652a00'))).toStrictEqual({ age: 42n, firstname: 'Alice' });
});

test('it uses the raw field identifiers', () => {
    const codec = getNodeValueCodec([
        structTypeNode([structFieldTypeNode({ identifier: 'my_field', type: integerTypeNode('u8') })]),
    ]);
    expect(codec.encode({ my_field: 42 })).toStrictEqual(hex('2a'));
    expect(codec.decode(hex('2a'))).toStrictEqual({ my_field: 42n });
});

test('it always encodes the default value of omitted fields', () => {
    const codec = getNodeValueCodec([
        structTypeNode([
            structFieldTypeNode({
                defaultValue: integerValueNode('3'),
                defaultValueStrategy: 'omitted',
                identifier: 'discriminator',
                type: integerTypeNode('u8'),
            }),
            structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u16') }),
        ]),
    ]);
    expect(codec.encode({ amount: 42 })).toStrictEqual(hex('032a00'));
    expect(codec.encode({ amount: 42, discriminator: 7 })).toStrictEqual(hex('032a00'));
    expect(codec.decode(hex('032a00'))).toStrictEqual({ amount: 42n, discriminator: 3n });
});

test('it encodes the default value of optional fields when missing', () => {
    const fee = structFieldTypeNode({
        defaultValue: integerValueNode('5'),
        identifier: 'fee',
        type: integerTypeNode('u16'),
    });
    const explicitFee = structFieldTypeNode({ ...fee, defaultValueStrategy: 'optional' });
    for (const field of [fee, explicitFee]) {
        const codec = getNodeValueCodec([structTypeNode([field])]);
        expect(codec.encode({})).toStrictEqual(hex('0500'));
        expect(codec.encode({ fee: 9 })).toStrictEqual(hex('0900'));
    }
});

test('it encodes missing structs as structs with missing fields', () => {
    const codec = getNodeValueCodec([
        structTypeNode([
            structFieldTypeNode({
                defaultValue: integerValueNode('3'),
                defaultValueStrategy: 'omitted',
                identifier: 'discriminator',
                type: integerTypeNode('u8'),
            }),
            structFieldTypeNode({
                defaultValue: structValueNode([structFieldValueNode('fee', integerValueNode('5'))]),
                identifier: 'config',
                type: structTypeNode([structFieldTypeNode({ identifier: 'fee', type: integerTypeNode('u16') })]),
            }),
        ]),
    ]);
    expect(codec.encode(undefined)).toStrictEqual(hex('030500'));
    expect(codec.encode({ config: undefined })).toStrictEqual(hex('030500'));
    expect(() => codec.encode({ config: {} })).toThrow();
});

test('it encodes default values of any kind', () => {
    const codec = getNodeValueCodec([
        structTypeNode([
            structFieldTypeNode({
                defaultValue: bytesValueNode('base16', 'e445a52e'),
                defaultValueStrategy: 'omitted',
                identifier: 'discriminator',
                type: bytesTypeNode({ transforms: [fixedSizeTransformNode(4)] }),
            }),
            structFieldTypeNode({
                defaultValue: someValueNode(stringValueNode('Hi')),
                identifier: 'memo',
                type: optionTypeNode(stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(2)] })),
            }),
        ]),
    ]);
    expect(codec.encode({})).toStrictEqual(hex('e445a52e014869'));
});
