import { numberTypeNode, optionTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes prefixed options', () => {
    const codec = getNodeCodec([optionTypeNode(numberTypeNode('u16'))]);
    expect(codec.encode({ __option: 'Some', value: 42 })).toStrictEqual(hex('012a00'));
    expect(codec.decode(hex('012a00'))).toStrictEqual({ __option: 'Some', value: 42 });
    expect(codec.encode({ __option: 'None' })).toStrictEqual(hex('00'));
    expect(codec.decode(hex('00'))).toStrictEqual({ __option: 'None' });
});

test('it encodes prefixed options with custom sizes', () => {
    const codec = getNodeCodec([optionTypeNode(numberTypeNode('u16'), { prefix: numberTypeNode('u32') })]);
    expect(codec.encode({ __option: 'Some', value: 42 })).toStrictEqual(hex('010000002a00'));
    expect(codec.decode(hex('010000002a00'))).toStrictEqual({ __option: 'Some', value: 42 });
    expect(codec.encode({ __option: 'None' })).toStrictEqual(hex('00000000'));
    expect(codec.decode(hex('00000000'))).toStrictEqual({ __option: 'None' });
});

test('it encodes prefixed options with fixed size items', () => {
    const codec = getNodeCodec([optionTypeNode(numberTypeNode('u16'), { fixed: true })]);
    expect(codec.encode({ __option: 'Some', value: 42 })).toStrictEqual(hex('012a00'));
    expect(codec.decode(hex('012a00'))).toStrictEqual({ __option: 'Some', value: 42 });
    expect(codec.encode({ __option: 'None' })).toStrictEqual(hex('000000'));
    expect(codec.decode(hex('000000'))).toStrictEqual({ __option: 'None' });
});
