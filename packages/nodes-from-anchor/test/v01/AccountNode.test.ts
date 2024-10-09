import {
    accountNode,
    bytesTypeNode,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { accountNodeFromAnchorV01, getAnchorDiscriminatorV01 } from '../../src';

test('it creates account nodes with anchor discriminators', () => {
    const node = accountNodeFromAnchorV01(
        {
            discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
            name: 'MyAccount',
        },
        [
            {
                docs: [],
                name: 'MyAccount',
                type: {
                    fields: [
                        {
                            name: 'name',
                            type: 'u32',
                        },
                    ],
                    kind: 'struct',
                },
            },
        ],
    );

    expect(node).toEqual(
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: fixedSizeTypeNode(bytesTypeNode(), 8),
                }),
                structFieldTypeNode({
                    name: 'name',
                    type: numberTypeNode('u32'),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'myAccount',
        }),
    );
});
