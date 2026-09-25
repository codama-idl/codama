import { definedTypeNode, integerTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { definedTypeNodeFromAnchorV00 } from '../../src';

test('it creates defined type nodes', () => {
    // When we convert an Anchor defined type.
    const node = definedTypeNodeFromAnchorV00({
        docs: ['My type.'],
        name: 'my_type',
        type: {
            fields: [{ name: 'my_field', type: 'u64' }],
            kind: 'struct',
        },
    });

    // Then we expect a defined type node that keeps the IDL casing.
    expect(node).toEqual(
        definedTypeNode({
            docs: 'My type.',
            identifier: 'my_type',
            type: structTypeNode([
                structFieldTypeNode({
                    identifier: 'my_field',
                    type: integerTypeNode('u64'),
                }),
            ]),
        }),
    );
});
