import { numberTypeNode, remainderOptionTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes remainder options', () => {
    const codec = getNodeCodec([remainderOptionTypeNode(numberTypeNode('u16'))]);
    expect(codec.encode({ __option: 'Some', value: 42 })).toStrictEqual(hex('2a00'));
    expect(codec.decode(hex('2a00'))).toStrictEqual({ __option: 'Some', value: 42 });
    expect(codec.encode({ __option: 'None' })).toStrictEqual(hex(''));
    expect(codec.decode(hex(''))).toStrictEqual({ __option: 'None' });
});
