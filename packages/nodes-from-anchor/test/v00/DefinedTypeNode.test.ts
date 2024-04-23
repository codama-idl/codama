import { definedTypeNode, numberTypeNode, structFieldTypeNode, structTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { definedTypeNodeFromAnchorV00 } from '../../src/index.js';

test('it creates defined type nodes', t => {
    const node = definedTypeNodeFromAnchorV00({
        name: 'myType',
        type: {
            fields: [{ name: 'myField', type: 'u64' }],
            kind: 'struct',
        },
    });

    t.deepEqual(
        node,
        definedTypeNode({
            name: 'myType',
            type: structTypeNode([
                structFieldTypeNode({
                    name: 'myField',
                    type: numberTypeNode('u64'),
                }),
            ]),
        }),
    );
});
