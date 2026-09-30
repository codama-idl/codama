import { integerTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates tuple type nodes', () => {
    // When we convert the Anchor type.
    const node = typeNodeFromAnchorV00({
        tuple: ['u8', 'publicKey'],
    });

    // Then we expect the equivalent Codama type node.
    expect(node).toEqual(tupleTypeNode([integerTypeNode('u8'), publicKeyTypeNode()]));
});
