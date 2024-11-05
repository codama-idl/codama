import {
    constantValueNode,
    fixedSizeTypeNode,
    hiddenPrefixTypeNode,
    numberTypeNode,
    numberValueNode,
    stringTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it hides hidden prefixes from the main type', () => {
    const codec = getNodeCodec([
        hiddenPrefixTypeNode(fixedSizeTypeNode(stringTypeNode('utf8'), 5), [
            constantValueNode(numberTypeNode('u64'), numberValueNode(42)),
        ]),
    ]);
    expect(codec.encode('Alice')).toStrictEqual(hex('2a00000000000000416c696365'));
    expect(codec.decode(hex('2a00000000000000416c696365'))).toStrictEqual('Alice');
});
