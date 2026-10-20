import { integerTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src/v01/typeNodes/TypeNode';
import { GenericsV01 } from '../../../src/v01/unwrapGenerics';

const generics = {} as GenericsV01;

test('it creates tuple type nodes', () => {
    const node = typeNodeFromAnchorV01(
        {
            fields: ['u8', 'pubkey'],
            kind: 'struct',
        },
        generics,
    );

    expect(node).toEqual(tupleTypeNode([integerTypeNode('u8'), publicKeyTypeNode()]));
});
