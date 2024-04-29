import {
    numberTypeNode,
    sizePrefixTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates struct type nodes', t => {
    // TODO: Fix 2 fields always registering as a tuple when this should be a struct
    const node = typeNodeFromAnchorV01({
        fields: [
            { name: 'name', type: 'string' },
            { name: 'age', type: 'u8' },
            { name: 'created_at', type: 'u8' },
        ],
        kind: 'struct',
    });

    t.deepEqual(
        node,
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
