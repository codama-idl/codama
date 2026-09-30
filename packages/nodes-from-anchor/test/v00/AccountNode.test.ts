import {
    accountNode,
    bytesTypeNode,
    bytesValueNode,
    fieldDiscriminatorNode,
    fixedSizeTransformNode,
    integerTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { accountNodeFromAnchorV00 } from '../../src';

test('it creates account nodes', () => {
    // When we convert an Anchor account.
    const node = accountNodeFromAnchorV00({
        name: 'my_account',
        type: {
            fields: [{ name: 'my_field', type: 'u64' }],
            kind: 'struct',
        },
    });

    // Then we expect an account node that keeps the IDL casing.
    expect(node).toEqual(
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    identifier: 'my_field',
                    type: integerTypeNode('u64'),
                }),
            ]),
            identifier: 'my_account',
        }),
    );
});

test('it creates account nodes with docs', () => {
    // When we convert an Anchor account with multiple lines of docs.
    const node = accountNodeFromAnchorV00({
        docs: ['First line.', 'Second line.'],
        name: 'myAccount',
        type: { fields: [], kind: 'struct' },
    });

    // Then we expect the docs to be joined into a single string.
    expect(node).toEqual(accountNode({ docs: 'First line.\nSecond line.', identifier: 'myAccount' }));
});

test('it creates account nodes with anchor discriminators', () => {
    // When we convert an Anchor account with an Anchor origin.
    const node = accountNodeFromAnchorV00(
        {
            name: 'myAccount',
            type: { fields: [], kind: 'struct' },
        },
        'anchor',
    );

    // Then we expect a discriminator field to be prepended to the account data.
    expect(node).toEqual(
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: bytesValueNode('base16', 'f61c0657fb2d322a'),
                    defaultValueStrategy: 'omitted',
                    identifier: 'discriminator',
                    type: bytesTypeNode({ transforms: [fixedSizeTransformNode(8)] }),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'myAccount',
        }),
    );
});
