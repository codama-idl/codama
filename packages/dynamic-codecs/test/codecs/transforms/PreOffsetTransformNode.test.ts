import { integerTypeNode, preOffsetTransformNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../../src';
import { hex } from '../../_setup';

test('it encodes relative pre-offsets', () => {
    const node = tupleTypeNode([
        integerTypeNode('u8', { transforms: [preOffsetTransformNode(1)] }),
        integerTypeNode('u8', { transforms: [preOffsetTransformNode(-2)] }),
    ]);
    const codec = getNodeValueCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('ffaa'));
    expect(codec.decode(hex('ffaa'))).toStrictEqual([0xaan, 0xffn]);
});

test('it encodes padded pre-offsets', () => {
    const node = tupleTypeNode([
        integerTypeNode('u8', { transforms: [preOffsetTransformNode(4, { strategy: 'padded' })] }),
        integerTypeNode('u8'),
    ]);
    const codec = getNodeValueCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('00000000aaff'));
    expect(codec.decode(hex('00000000aaff'))).toStrictEqual([0xaan, 0xffn]);
});

test('it encodes absolute pre-offsets', () => {
    const node = tupleTypeNode([
        integerTypeNode('u8', { transforms: [preOffsetTransformNode(1)] }),
        integerTypeNode('u8', { transforms: [preOffsetTransformNode(0, { strategy: 'absolute' })] }),
    ]);
    const codec = getNodeValueCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('ffaa'));
    expect(codec.decode(hex('ffaa'))).toStrictEqual([0xaan, 0xffn]);
});
