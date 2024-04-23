import {
    accountNode,
    bytesTypeNode,
    bytesValueNode,
    fieldDiscriminatorNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { accountNodeFromAnchorV00 } from '../../src/index.js';

test('it creates account nodes', t => {
    const node = accountNodeFromAnchorV00({
        name: 'myAccount',
        type: {
            fields: [{ name: 'myField', type: 'u64' }],
            kind: 'struct',
        },
    });

    t.deepEqual(
        node,
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

test('it creates account nodes with anchor discriminators', t => {
    const node = accountNodeFromAnchorV00(
        {
            name: 'myAccount',
            type: { fields: [], kind: 'struct' },
        },
        'anchor',
    );

    t.deepEqual(
        node,
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: bytesValueNode('base16', 'f61c0657fb2d322a'),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: bytesTypeNode(),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'myAccount',
        }),
    );
});
