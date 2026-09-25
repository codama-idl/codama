import {
    accountNode,
    bytesTypeNode,
    fieldDiscriminatorNode,
    fixedSizeTransformNode,
    integerTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { accountNodeFromAnchorV01, GenericsV01, getAnchorDiscriminatorV01 } from '../../src';

const generics = {} as GenericsV01;

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
        generics,
    );

    expect(node).toEqual(
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                    defaultValueStrategy: 'omitted',
                    identifier: 'discriminator',
                    type: bytesTypeNode({ transforms: [fixedSizeTransformNode(8)] }),
                }),
                structFieldTypeNode({
                    identifier: 'name',
                    type: integerTypeNode('u32'),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'MyAccount',
        }),
    );
});

test('it includes the docs of the account type', () => {
    const node = accountNodeFromAnchorV01(
        {
            discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
            name: 'MyAccount',
        },
        [
            {
                docs: ['My account.', 'With two lines.'],
                name: 'MyAccount',
                type: { fields: [], kind: 'struct' },
            },
        ],
        generics,
    );

    expect(node).toEqual(
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                    defaultValueStrategy: 'omitted',
                    identifier: 'discriminator',
                    type: bytesTypeNode({ transforms: [fixedSizeTransformNode(8)] }),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            docs: 'My account.\nWith two lines.',
            identifier: 'MyAccount',
        }),
    );
});
