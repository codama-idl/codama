import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, typeNodeFromAnchorV01 } from '../../../src';

const generics = {} as GenericsV01;

test('it creates tuple type nodes', () => {
    const node = typeNodeFromAnchorV01(
        {
            fields: ['u8', 'pubkey'],
            kind: 'struct',
        },
        generics,
    );

    expect(node).toEqual(tupleTypeNode([numberTypeNode('u8'), publicKeyTypeNode()]));
});
