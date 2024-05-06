import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates tuple type nodes', () => {
    const node = typeNodeFromAnchorV00({
        tuple: ['u8', 'publicKey'],
    });

    expect(node).toEqual(tupleTypeNode([numberTypeNode('u8'), publicKeyTypeNode()]));
});
