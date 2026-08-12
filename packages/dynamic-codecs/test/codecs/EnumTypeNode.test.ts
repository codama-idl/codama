import {
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    fixedSizeTypeNode,
    numberTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes scalar enums as discriminated unions', () => {
    const codec = getNodeCodec([enumTypeNode([enumEmptyVariantTypeNode('up'), enumEmptyVariantTypeNode('down')])]);
    expect(codec.encode({ __kind: 'Up' })).toStrictEqual(hex('00'));
    expect(codec.decode(hex('00'))).toStrictEqual({ __kind: 'Up' });
    expect(codec.encode({ __kind: 'Down' })).toStrictEqual(hex('01'));
    expect(codec.decode(hex('01'))).toStrictEqual({ __kind: 'Down' });
});

test('it encodes scalar enums with custom sizes', () => {
    const codec = getNodeCodec([
        enumTypeNode([enumEmptyVariantTypeNode('up'), enumEmptyVariantTypeNode('down')], {
            size: numberTypeNode('u16'),
        }),
    ]);
    expect(codec.encode({ __kind: 'Up' })).toStrictEqual(hex('0000'));
    expect(codec.decode(hex('0000'))).toStrictEqual({ __kind: 'Up' });
    expect(codec.encode({ __kind: 'Down' })).toStrictEqual(hex('0100'));
    expect(codec.decode(hex('0100'))).toStrictEqual({ __kind: 'Down' });
});

test('it decodes empty variants the same way in scalar and data enums', () => {
    const scalar = getNodeCodec([enumTypeNode([enumEmptyVariantTypeNode('quit'), enumEmptyVariantTypeNode('stay')])]);
    const data = getNodeCodec([
        enumTypeNode([
            enumEmptyVariantTypeNode('quit'),
            enumStructVariantTypeNode(
                'move',
                structTypeNode([structFieldTypeNode({ name: 'x', type: numberTypeNode('u8') })]),
            ),
        ]),
    ]);
    expect(scalar.decode(hex('00'))).toStrictEqual({ __kind: 'Quit' });
    expect(data.decode(hex('00'))).toStrictEqual({ __kind: 'Quit' });
});

test('it encodes data enums', () => {
    const codec = getNodeCodec([
        enumTypeNode([
            enumEmptyVariantTypeNode('quit'),
            enumTupleVariantTypeNode('write', tupleTypeNode([fixedSizeTypeNode(stringTypeNode('utf8'), 5)])),
            enumStructVariantTypeNode(
                'move',
                structTypeNode([
                    structFieldTypeNode({ name: 'x', type: numberTypeNode('u8') }),
                    structFieldTypeNode({ name: 'y', type: numberTypeNode('u8') }),
                ]),
            ),
        ]),
    ]);
    const quitVariant = { __kind: 'Quit' };
    expect(codec.encode(quitVariant)).toStrictEqual(hex('00'));
    expect(codec.decode(hex('00'))).toStrictEqual(quitVariant);
    const writeVariant = { __kind: 'Write', fields: ['Hello'] };
    expect(codec.encode(writeVariant)).toStrictEqual(hex('0148656c6c6f'));
    expect(codec.decode(hex('0148656c6c6f'))).toStrictEqual(writeVariant);
    const moveVariant = { __kind: 'Move', x: 10, y: 20 };
    expect(codec.encode(moveVariant)).toStrictEqual(hex('020a14'));
    expect(codec.decode(hex('020a14'))).toStrictEqual(moveVariant);
});

test('it encodes data enums with custom sizes', () => {
    const codec = getNodeCodec([
        enumTypeNode(
            [
                enumEmptyVariantTypeNode('quit'),
                enumTupleVariantTypeNode('write', tupleTypeNode([fixedSizeTypeNode(stringTypeNode('utf8'), 5)])),
            ],
            { size: numberTypeNode('u16') },
        ),
    ]);
    const quitVariant = { __kind: 'Quit' };
    expect(codec.encode(quitVariant)).toStrictEqual(hex('0000'));
    expect(codec.decode(hex('0000'))).toStrictEqual(quitVariant);
    const writeVariant = { __kind: 'Write', fields: ['Hello'] };
    expect(codec.encode(writeVariant)).toStrictEqual(hex('010048656c6c6f'));
    expect(codec.decode(hex('010048656c6c6f'))).toStrictEqual(writeVariant);
});
