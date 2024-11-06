import { fixedSizeTypeNode, numberTypeNode, stringTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes tuples', () => {
    const codec = getNodeCodec([tupleTypeNode([fixedSizeTypeNode(stringTypeNode('utf8'), 3), numberTypeNode('u16')])]);
    expect(codec.encode(['foo', 42])).toStrictEqual(hex('666f6f2a00'));
    expect(codec.decode(hex('666f6f2a00'))).toStrictEqual(['foo', 42]);
});
