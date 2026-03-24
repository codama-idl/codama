import { constantDiscriminatorNode, constantValueNode } from '@codama/nodes';
import {
    bytesTypeNode,
    eventNode,
    fixedSizeTypeNode,
    hiddenPrefixTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { eventNodeFromAnchorV01, GenericsV01, getAnchorDiscriminatorV01 } from '../../src';

const generics = {} as GenericsV01;

test('it creates event nodes with anchor discriminators', () => {
    const node = eventNodeFromAnchorV01(
        {
            discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
            name: 'MyEvent',
        },
        [
            {
                docs: [],
                name: 'MyEvent',
                type: {
                    fields: [
                        {
                            name: 'amount',
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
        eventNode({
            data: hiddenPrefixTypeNode(
                structTypeNode([structFieldTypeNode({ name: 'amount', type: numberTypeNode('u32') })]),
                [
                    constantValueNode(
                        fixedSizeTypeNode(bytesTypeNode(), 8),
                        getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                    ),
                ],
            ),
            discriminators: [
                constantDiscriminatorNode(
                    constantValueNode(
                        fixedSizeTypeNode(bytesTypeNode(), 8),
                        getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                    ),
                ),
            ],
            name: 'myEvent',
        }),
    );
});

test('it creates tuple event nodes with anchor discriminators', () => {
    const node = eventNodeFromAnchorV01(
        {
            discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
            name: 'TupleEvent',
        },
        [
            {
                docs: [],
                name: 'TupleEvent',
                type: {
                    fields: ['u32', 'u64'],
                    kind: 'struct',
                },
            },
        ],
        generics,
    );

    expect(node).toEqual(
        eventNode({
            data: hiddenPrefixTypeNode(tupleTypeNode([numberTypeNode('u32'), numberTypeNode('u64')]), [
                constantValueNode(
                    fixedSizeTypeNode(bytesTypeNode(), 8),
                    getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                ),
            ]),
            discriminators: [
                constantDiscriminatorNode(
                    constantValueNode(
                        fixedSizeTypeNode(bytesTypeNode(), 8),
                        getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                    ),
                ),
            ],
            name: 'tupleEvent',
        }),
    );
});

test('it throws when the backing event type is missing', () => {
    expect(() =>
        eventNodeFromAnchorV01(
            {
                discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
                name: 'MissingEvent',
            },
            [],
            generics,
        ),
    ).toThrow('Event type [MissingEvent] is missing from the IDL types.');
});
