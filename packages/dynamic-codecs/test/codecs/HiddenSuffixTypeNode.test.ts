import {
    constantValueNode,
    fixedSizeTypeNode,
    hiddenSuffixTypeNode,
    numberTypeNode,
    numberValueNode,
    stringTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it hides hidden suffixes from the main type', () => {
    const codec = getNodeCodec([
        hiddenSuffixTypeNode(fixedSizeTypeNode(stringTypeNode('utf8'), 5), [
            constantValueNode(numberTypeNode('u64'), numberValueNode(42)),
        ]),
    ]);
    expect(codec.encode('Alice')).toStrictEqual(hex('416c6963652a00000000000000'));
    expect(codec.decode(hex('416c6963652a00000000000000'))).toStrictEqual('Alice');
});
