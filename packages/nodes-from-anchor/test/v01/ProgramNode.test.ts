import {
    accountNode,
    accountValueNode,
    arrayTypeNode,
    bytesTypeNode,
    constantDiscriminatorNode,
    constantPdaSeedNodeFromBytes,
    constantValueNode,
    dataValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    errorNode,
    eventNode,
    fieldDiscriminatorNode,
    fixedCountNode,
    fixedSizeTransformNode,
    hiddenPrefixTransformNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getAnchorDiscriminatorV01, programNodeFromAnchorV01 } from '../../src';

test('it creates program nodes', () => {
    const node = programNodeFromAnchorV01({
        accounts: [{ discriminator: [246, 28, 6, 87, 251, 45, 50, 42], name: 'MyAccount' }],
        address: '1111',
        docs: ['My program.', 'With two lines.'],
        errors: [{ code: 42, msg: 'my error message', name: 'myError' }],
        events: [{ discriminator: [1, 2, 3, 4, 5, 6, 7, 8], name: 'MyEvent' }],
        instructions: [
            {
                accounts: [
                    {
                        name: 'authority',
                        pda: {
                            seeds: [
                                { kind: 'const', value: [42, 31, 29] },
                                { kind: 'account', path: 'owner' },
                                { kind: 'arg', path: 'amount' },
                            ],
                        },
                    },
                    {
                        name: 'owner',
                    },
                    {
                        name: 'some_account',
                    },
                ],
                args: [
                    {
                        name: 'amount',
                        type: 'u8',
                    },
                ],
                discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
                name: 'my_instruction',
            },
        ],
        metadata: { name: 'my_program', spec: '0.1.0', version: '1.2.3' },
        types: [
            {
                docs: ['My account.'],
                name: 'MyAccount',
                type: { fields: [{ name: 'delegate', type: 'pubkey' }], kind: 'struct' },
            },
            {
                docs: ['My event.'],
                name: 'MyEvent',
                type: { fields: [{ name: 'amount', type: 'u64' }], kind: 'struct' },
            },
        ],
    });

    const accountDiscriminator = getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]);
    const eventDiscriminator = constantValueNode(
        bytesTypeNode({ transforms: [fixedSizeTransformNode(8)] }),
        getAnchorDiscriminatorV01([1, 2, 3, 4, 5, 6, 7, 8]),
    );
    expect(node).toEqual(
        programNode({
            accounts: [
                accountNode({
                    data: structTypeNode([
                        structFieldTypeNode({
                            defaultValue: accountDiscriminator,
                            defaultValueStrategy: 'omitted',
                            identifier: 'discriminator',
                            type: bytesTypeNode({ transforms: [fixedSizeTransformNode(8)] }),
                        }),
                        structFieldTypeNode({
                            identifier: 'delegate',
                            type: publicKeyTypeNode(),
                        }),
                    ]),
                    discriminators: [fieldDiscriminatorNode('discriminator')],
                    docs: 'My account.',
                    identifier: 'MyAccount',
                }),
            ],
            docs: 'My program.\nWith two lines.',
            errors: [
                errorNode({
                    code: 42,
                    docs: 'myError: my error message',
                    identifier: 'myError',
                    message: 'my error message',
                }),
            ],
            events: [
                eventNode({
                    data: structTypeNode(
                        [
                            structFieldTypeNode({
                                identifier: 'amount',
                                type: integerTypeNode('u64'),
                            }),
                        ],
                        { transforms: [hiddenPrefixTransformNode([eventDiscriminator])] },
                    ),
                    discriminators: [constantDiscriminatorNode(eventDiscriminator)],
                    docs: 'My event.',
                    identifier: 'MyEvent',
                }),
            ],
            identifier: 'my_program',
            instructions: [
                instructionNode({
                    accounts: [
                        instructionAccountNode({
                            defaultValue: pdaValueNode(
                                pdaNode({
                                    identifier: 'authority',
                                    seeds: [
                                        constantPdaSeedNodeFromBytes('base58', 'F9bS'),
                                        variablePdaSeedNode('owner', publicKeyTypeNode()),
                                        variablePdaSeedNode('amount', integerTypeNode('u8')),
                                    ],
                                }),
                                {
                                    seeds: [
                                        pdaSeedValueNode('owner', accountValueNode('owner')),
                                        pdaSeedValueNode('amount', dataValueNode('amount')),
                                    ],
                                },
                            ),
                            identifier: 'authority',
                            isSigner: false,
                            isWritable: false,
                        }),
                        instructionAccountNode({
                            identifier: 'owner',
                            isSigner: false,
                            isWritable: false,
                        }),
                        instructionAccountNode({
                            identifier: 'some_account',
                            isSigner: false,
                            isWritable: false,
                        }),
                    ],
                    data: structTypeNode([
                        structFieldTypeNode({
                            defaultValue: accountDiscriminator,
                            defaultValueStrategy: 'omitted',
                            identifier: 'discriminator',
                            type: bytesTypeNode({ transforms: [fixedSizeTransformNode(8)] }),
                        }),
                        structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u8') }),
                    ]),
                    discriminators: [fieldDiscriminatorNode('discriminator')],
                    identifier: 'my_instruction',
                }),
            ],
            publicKey: '1111',
            version: '1.2.3',
        }),
    );
});

test('it unwraps and removes generic types', () => {
    const node = programNodeFromAnchorV01({
        address: '1111',
        instructions: [],
        metadata: { name: 'my_program', spec: '0.1.0', version: '1.2.3' },
        types: [
            {
                generics: [
                    { kind: 'const', name: 'N', type: 'usize' },
                    { kind: 'type', name: 'T' },
                ],
                name: 'SimpleAllocator',
                type: {
                    fields: [
                        {
                            name: 'state',
                            type: { array: [{ defined: { name: 'ItemState' } }, { generic: 'N' }] },
                        },
                        {
                            name: 'data',
                            type: { array: [{ generic: 'T' }, { generic: 'N' }] },
                        },
                    ],
                    kind: 'struct',
                },
            },
            {
                name: 'AccountData',
                type: {
                    kind: 'enum',
                    variants: [
                        { name: 'Unknown' },
                        {
                            fields: [
                                {
                                    defined: {
                                        generics: [
                                            { kind: 'const', value: '1000' },
                                            { kind: 'type', type: { defined: { name: 'VirtualTimelockAccount' } } },
                                        ],
                                        name: 'SimpleAllocator',
                                    },
                                },
                            ],
                            name: 'Timelock',
                        },
                        {
                            fields: [
                                {
                                    defined: {
                                        generics: [
                                            { kind: 'const', value: '500' },
                                            { kind: 'type', type: { defined: { name: 'VirtualDurableNonce' } } },
                                        ],
                                        name: 'SimpleAllocator',
                                    },
                                },
                            ],
                            name: 'Nonce',
                        },
                        {
                            fields: [
                                {
                                    defined: {
                                        generics: [
                                            { kind: 'const', value: '250' },
                                            { kind: 'type', type: { defined: { name: 'VirtualRelayAccount' } } },
                                        ],
                                        name: 'SimpleAllocator',
                                    },
                                },
                            ],
                            name: 'Relay',
                        },
                    ],
                },
            },
        ],
    });

    expect(node).toEqual(
        programNode({
            definedTypes: [
                definedTypeNode({
                    identifier: 'AccountData',
                    type: enumTypeNode([
                        enumVariantTypeNode('Unknown'),
                        enumVariantTypeNode('Timelock', {
                            data: tupleTypeNode([
                                structTypeNode([
                                    structFieldTypeNode({
                                        identifier: 'state',
                                        type: arrayTypeNode(definedTypeLinkNode('ItemState'), fixedCountNode(1000)),
                                    }),
                                    structFieldTypeNode({
                                        identifier: 'data',
                                        type: arrayTypeNode(
                                            definedTypeLinkNode('VirtualTimelockAccount'),
                                            fixedCountNode(1000),
                                        ),
                                    }),
                                ]),
                            ]),
                        }),
                        enumVariantTypeNode('Nonce', {
                            data: tupleTypeNode([
                                structTypeNode([
                                    structFieldTypeNode({
                                        identifier: 'state',
                                        type: arrayTypeNode(definedTypeLinkNode('ItemState'), fixedCountNode(500)),
                                    }),
                                    structFieldTypeNode({
                                        identifier: 'data',
                                        type: arrayTypeNode(
                                            definedTypeLinkNode('VirtualDurableNonce'),
                                            fixedCountNode(500),
                                        ),
                                    }),
                                ]),
                            ]),
                        }),
                        enumVariantTypeNode('Relay', {
                            data: tupleTypeNode([
                                structTypeNode([
                                    structFieldTypeNode({
                                        identifier: 'state',
                                        type: arrayTypeNode(definedTypeLinkNode('ItemState'), fixedCountNode(250)),
                                    }),
                                    structFieldTypeNode({
                                        identifier: 'data',
                                        type: arrayTypeNode(
                                            definedTypeLinkNode('VirtualRelayAccount'),
                                            fixedCountNode(250),
                                        ),
                                    }),
                                ]),
                            ]),
                        }),
                    ]),
                }),
            ],
            identifier: 'my_program',
            publicKey: '1111',
            version: '1.2.3',
        }),
    );
});
