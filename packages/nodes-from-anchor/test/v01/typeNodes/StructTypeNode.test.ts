import {
    numberTypeNode,
    sizePrefixTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates struct type nodes', () => {
    // TODO: Fix 2 fields always registering as a tuple when this should be a struct
    const node = typeNodeFromAnchorV01({
        fields: [
            { name: 'name', type: 'string' },
            { name: 'age', type: 'u8' },
            { name: 'created_at', type: 'u8' },
        ],
        kind: 'struct',
    });

    expect(node).toEqual(
        structTypeNode([
            structFieldTypeNode({
                name: 'name',
                type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')),
            }),
            structFieldTypeNode({ name: 'age', type: numberTypeNode('u8') }),
            structFieldTypeNode({ name: 'createdAt', type: numberTypeNode('u8') }),
        ]),
    );
});
