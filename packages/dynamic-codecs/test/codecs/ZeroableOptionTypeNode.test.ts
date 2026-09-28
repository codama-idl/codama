import { constantValueNodeFromBytes, integerTypeNode, zeroableOptionTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes zeroable options', () => {
    const codec = getNodeValueCodec([zeroableOptionTypeNode(integerTypeNode('u16'))]);
    expect(codec.encode({ __option: 'Some', value: 42 })).toStrictEqual(hex('2a00'));
    expect(codec.decode(hex('2a00'))).toStrictEqual({ __option: 'Some', value: 42n });
    expect(codec.encode({ __option: 'None' })).toStrictEqual(hex('0000'));
    expect(codec.decode(hex('0000'))).toStrictEqual({ __option: 'None' });
});

test('it encodes zeroable options with custom zero values', () => {
    const zeroValue = constantValueNodeFromBytes('base16', 'ffff');
    const codec = getNodeValueCodec([zeroableOptionTypeNode(integerTypeNode('u16'), { zeroValue })]);
    expect(codec.encode({ __option: 'Some', value: 42 })).toStrictEqual(hex('2a00'));
    expect(codec.decode(hex('2a00'))).toStrictEqual({ __option: 'Some', value: 42n });
    expect(codec.encode({ __option: 'None' })).toStrictEqual(hex('ffff'));
    expect(codec.decode(hex('ffff'))).toStrictEqual({ __option: 'None' });
});
