import {
    accountNode,
    bytesTypeNode,
    bytesValueNode,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { accountNodeFromAnchorV00 } from '../../src';

test('it creates account nodes', () => {
    const node = accountNodeFromAnchorV00({
        name: 'myAccount',
        type: {
            fields: [{ name: 'myField', type: 'u64' }],
            kind: 'struct',
        },
    });

    expect(node).toEqual(
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    name: 'myField',
                    type: numberTypeNode('u64'),
                }),
            ]),
            name: 'myAccount',
        }),
    );
});

test('it creates account nodes with anchor discriminators', () => {
    const node = accountNodeFromAnchorV00(
        {
            name: 'myAccount',
            type: { fields: [], kind: 'struct' },
        },
        'anchor',
    );

    expect(node).toEqual(
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: bytesValueNode('base16', 'f61c0657fb2d322a'),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: fixedSizeTypeNode(bytesTypeNode(), 8),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'myAccount',
        }),
    );
});
