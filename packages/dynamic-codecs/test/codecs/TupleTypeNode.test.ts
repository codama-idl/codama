import { fixedSizeTransformNode, integerTypeNode, stringTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes tuples', () => {
    const codec = getNodeValueCodec([
        tupleTypeNode([stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(3)] }), integerTypeNode('u16')]),
    ]);
    expect(codec.encode(['foo', 42])).toStrictEqual(hex('666f6f2a00'));
    expect(codec.decode(hex('666f6f2a00'))).toStrictEqual(['foo', 42n]);
});
