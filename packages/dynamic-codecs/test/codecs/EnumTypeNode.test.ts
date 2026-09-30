import { CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, CodamaError } from '@codama/errors';
import {
    enumTypeNode,
    enumVariantTypeNode,
    fixedSizeTransformNode,
    integerTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes scalar enums as discriminated unions', () => {
    const codec = getNodeValueCodec([enumTypeNode([enumVariantTypeNode('up'), enumVariantTypeNode('down')])]);
    expect(codec.encode({ __kind: 'up' })).toStrictEqual(hex('00'));
    expect(codec.decode(hex('00'))).toStrictEqual({ __discriminator: 0, __kind: 'up' });
    expect(codec.encode({ __kind: 'down' })).toStrictEqual(hex('01'));
    expect(codec.decode(hex('01'))).toStrictEqual({ __discriminator: 1, __kind: 'down' });
});

test('it uses the raw variant identifiers', () => {
    const codec = getNodeValueCodec([enumTypeNode([enumVariantTypeNode('my_variant')])]);
    expect(codec.encode({ __kind: 'my_variant' })).toStrictEqual(hex('00'));
    expect(codec.decode(hex('00'))).toStrictEqual({ __discriminator: 0, __kind: 'my_variant' });
});

test('it encodes scalar enums with custom sizes', () => {
    const codec = getNodeValueCodec([
        enumTypeNode([enumVariantTypeNode('up'), enumVariantTypeNode('down')], { size: integerTypeNode('u16') }),
    ]);
    expect(codec.encode({ __kind: 'up' })).toStrictEqual(hex('0000'));
    expect(codec.decode(hex('0000'))).toStrictEqual({ __discriminator: 0, __kind: 'up' });
    expect(codec.encode({ __kind: 'down' })).toStrictEqual(hex('0100'));
    expect(codec.decode(hex('0100'))).toStrictEqual({ __discriminator: 1, __kind: 'down' });
});

test('it encodes enums with big-endian sizes', () => {
    const codec = getNodeValueCodec([
        enumTypeNode([enumVariantTypeNode('up'), enumVariantTypeNode('down')], {
            size: integerTypeNode('u16', { endian: 'be' }),
        }),
    ]);
    expect(codec.encode({ __kind: 'down' })).toStrictEqual(hex('0001'));
    expect(codec.decode(hex('0001'))).toStrictEqual({ __discriminator: 1, __kind: 'down' });
});

test('it decodes variants without data the same way in scalar and data enums', () => {
    const scalar = getNodeValueCodec([enumTypeNode([enumVariantTypeNode('quit'), enumVariantTypeNode('stay')])]);
    const data = getNodeValueCodec([
        enumTypeNode([
            enumVariantTypeNode('quit'),
            enumVariantTypeNode('move', {
                data: structTypeNode([structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u8') })]),
            }),
        ]),
    ]);
    expect(scalar.decode(hex('00'))).toStrictEqual({ __discriminator: 0, __kind: 'quit' });
    expect(data.decode(hex('00'))).toStrictEqual({ __discriminator: 0, __kind: 'quit' });
});

test('it encodes data enums', () => {
    const codec = getNodeValueCodec([
        enumTypeNode([
            enumVariantTypeNode('quit'),
            enumVariantTypeNode('write', {
                data: tupleTypeNode([stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(5)] })]),
            }),
            enumVariantTypeNode('move', {
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u8') }),
                    structFieldTypeNode({ identifier: 'y', type: integerTypeNode('u8') }),
                ]),
            }),
            enumVariantTypeNode('amount', { data: integerTypeNode('u32') }),
        ]),
    ]);
    expect(codec.encode({ __kind: 'quit' })).toStrictEqual(hex('00'));
    expect(codec.decode(hex('00'))).toStrictEqual({ __discriminator: 0, __kind: 'quit' });
    expect(codec.encode({ __kind: 'write', data: ['Hello'] })).toStrictEqual(hex('0148656c6c6f'));
    expect(codec.decode(hex('0148656c6c6f'))).toStrictEqual({ __discriminator: 1, __kind: 'write', data: ['Hello'] });
    expect(codec.encode({ __kind: 'move', data: { x: 10, y: 20 } })).toStrictEqual(hex('020a14'));
    expect(codec.decode(hex('020a14'))).toStrictEqual({
        __discriminator: 2,
        __kind: 'move',
        data: { x: 10n, y: 20n },
    });
    expect(codec.encode({ __kind: 'amount', data: 42 })).toStrictEqual(hex('032a000000'));
    expect(codec.decode(hex('032a000000'))).toStrictEqual({ __discriminator: 3, __kind: 'amount', data: 42n });
});

test('it honours custom variant discriminators on the wire', () => {
    const codec = getNodeValueCodec([
        enumTypeNode([
            enumVariantTypeNode('info', { discriminator: 10 }),
            enumVariantTypeNode('warning', { discriminator: 20 }),
            enumVariantTypeNode('critical', { data: integerTypeNode('u8'), discriminator: 30 }),
        ]),
    ]);
    expect(codec.encode({ __kind: 'info' })).toStrictEqual(hex('0a'));
    expect(codec.decode(hex('0a'))).toStrictEqual({ __discriminator: 10, __kind: 'info' });
    expect(codec.encode({ __kind: 'critical', data: 7 })).toStrictEqual(hex('1e07'));
    expect(codec.decode(hex('1e07'))).toStrictEqual({ __discriminator: 30, __kind: 'critical', data: 7n });
});

test('it re-encodes its own decoded output', () => {
    const codec = getNodeValueCodec([
        enumTypeNode([
            enumVariantTypeNode('up', { discriminator: 5 }),
            enumVariantTypeNode('down', { data: integerTypeNode('u8'), discriminator: 9 }),
        ]),
    ]);
    expect(codec.encode(codec.decode(hex('05')))).toStrictEqual(hex('05'));
    expect(codec.encode(codec.decode(hex('092a')))).toStrictEqual(hex('092a'));
});

test('it infers omitted discriminators from the variant position', () => {
    // An omitted discriminator is the variant's position, not the previous explicit value plus one.
    const codec = getNodeValueCodec([
        enumTypeNode([
            enumVariantTypeNode('first', { discriminator: 5 }),
            enumVariantTypeNode('second'),
            enumVariantTypeNode('third', { discriminator: 9 }),
        ]),
    ]);
    expect(codec.encode({ __kind: 'first' })).toStrictEqual(hex('05'));
    expect(codec.encode({ __kind: 'second' })).toStrictEqual(hex('01'));
    expect(codec.encode({ __kind: 'third' })).toStrictEqual(hex('09'));
    expect(codec.decode(hex('01'))).toStrictEqual({ __discriminator: 1, __kind: 'second' });
    expect(codec.decode(hex('09'))).toStrictEqual({ __discriminator: 9, __kind: 'third' });
});

test('it encodes variants without data from their identifier', () => {
    const codec = getNodeValueCodec([
        enumTypeNode([enumVariantTypeNode('frozen'), enumVariantTypeNode('initialized')]),
    ]);
    expect(codec.encode('initialized')).toStrictEqual(hex('01'));
    expect(codec.encode({ __kind: 'initialized' })).toStrictEqual(hex('01'));
});

test('it throws when encoding an unknown variant', () => {
    const enumType = enumTypeNode([enumVariantTypeNode('frozen'), enumVariantTypeNode('initialized')]);
    const codec = getNodeValueCodec([enumType]);
    expect(() => codec.encode('Frozen')).toThrow(
        new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
            actualType: "variant 'Frozen'",
            expectedType: 'one of [frozen, initialized]',
            nodeKind: 'enumTypeNode',
            nodePath: [enumType],
        }),
    );
    expect(() => codec.encode({ __kind: 'thawed' })).toThrow(/variant 'thawed'/);
});

test('it throws when encoding a variant with data without its data', () => {
    const move = enumVariantTypeNode('move', { data: integerTypeNode('u8') });
    const enumType = enumTypeNode([enumVariantTypeNode('quit'), move]);
    const codec = getNodeValueCodec([enumType]);
    const error = new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
        actualType: "variant 'move' without data",
        expectedType: "{ __kind: 'move', data }",
        nodeKind: 'enumVariantTypeNode',
        nodePath: [enumType, move],
    });
    expect(() => codec.encode('move')).toThrow(error);
    expect(() => codec.encode({ __kind: 'move' })).toThrow(error);
    expect(() => codec.encode({ __kind: 'move', data: undefined })).toThrow(error);
    expect(codec.encode({ __kind: 'move', data: 7 })).toStrictEqual(hex('0107'));
});
