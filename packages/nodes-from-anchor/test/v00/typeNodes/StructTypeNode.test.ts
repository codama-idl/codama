import {
    numberTypeNode,
    sizePrefixTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV00 } from '../../../src/index.js';

test('it creates struct type nodes', t => {
    const node = typeNodeFromAnchorV00({
        fields: [
            { name: 'name', type: 'string' },
            { name: 'age', type: 'u8' },
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
        ]),
    );
});
