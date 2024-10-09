import { definedTypeNode, numberTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { definedTypeNodeFromAnchorV00 } from '../../src';

test('it creates defined type nodes', () => {
    const node = definedTypeNodeFromAnchorV00({
        name: 'myType',
        type: {
            fields: [{ name: 'myField', type: 'u64' }],
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
