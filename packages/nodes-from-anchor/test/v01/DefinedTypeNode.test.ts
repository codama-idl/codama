import { definedTypeNode, numberTypeNode, structFieldTypeNode, structTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { definedTypeNodeFromAnchorV01 } from '../../src';

test('it creates defined type nodes', () => {
    const node = definedTypeNodeFromAnchorV01({
        name: 'MyType',
        type: {
            fields: [{ name: 'my_field', type: 'u64' }],
            kind: 'struct',
        },
    });

    expect(node).toEqual(
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
