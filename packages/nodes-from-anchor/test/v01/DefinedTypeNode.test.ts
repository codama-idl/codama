import { definedTypeNode, numberTypeNode, structFieldTypeNode, structTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { definedTypeNodeFromAnchorV01 } from '../../src/index.js';

test('it creates defined type nodes', t => {
    const node = definedTypeNodeFromAnchorV01({
        name: 'MyType',
        type: {
            fields: [{ name: 'my_field', type: 'u64' }],
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
