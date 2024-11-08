import { constantValueNodeFromBytes, numberTypeNode, zeroableOptionTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes zeroable options', () => {
    const codec = getNodeCodec([zeroableOptionTypeNode(numberTypeNode('u16'))]);
    expect(codec.encode({ __option: 'Some', value: 42 })).toStrictEqual(hex('2a00'));
    expect(codec.decode(hex('2a00'))).toStrictEqual({ __option: 'Some', value: 42 });
    expect(codec.encode({ __option: 'None' })).toStrictEqual(hex('0000'));
    expect(codec.decode(hex('0000'))).toStrictEqual({ __option: 'None' });
});

test('it encodes zeroable options with custom zero values', () => {
    const zeroValue = constantValueNodeFromBytes('base16', 'ffff');
    const codec = getNodeCodec([zeroableOptionTypeNode(numberTypeNode('u16'), zeroValue)]);
    expect(codec.encode({ __option: 'Some', value: 42 })).toStrictEqual(hex('2a00'));
    expect(codec.decode(hex('2a00'))).toStrictEqual({ __option: 'Some', value: 42 });
    expect(codec.encode({ __option: 'None' })).toStrictEqual(hex('ffff'));
    expect(codec.decode(hex('ffff'))).toStrictEqual({ __option: 'None' });
});
