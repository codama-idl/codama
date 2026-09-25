import { CODAMA_ERROR__ANCHOR__EVENT_TYPE_MISSING, CodamaError } from '@codama/errors';
import {
    bytesTypeNode,
    constantDiscriminatorNode,
    constantValueNode,
    eventNode,
    fixedSizeTransformNode,
    hiddenPrefixTransformNode,
    integerTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { eventNodeFromAnchorV01, GenericsV01, getAnchorDiscriminatorV01 } from '../../src';

const generics = {} as GenericsV01;
const discriminator = constantValueNode(
    bytesTypeNode({ transforms: [fixedSizeTransformNode(8)] }),
    getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
);

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
            data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u32') })], {
                transforms: [hiddenPrefixTransformNode([discriminator])],
            }),
            discriminators: [constantDiscriminatorNode(discriminator)],
            identifier: 'MyEvent',
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
            data: tupleTypeNode([integerTypeNode('u32'), integerTypeNode('u64')], {
                transforms: [hiddenPrefixTransformNode([discriminator])],
            }),
            discriminators: [constantDiscriminatorNode(discriminator)],
            identifier: 'TupleEvent',
        }),
    );
});

test('it includes the docs of the event type', () => {
    const node = eventNodeFromAnchorV01(
        {
            discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
            name: 'MyEvent',
        },
        [
            {
                docs: ['My event.', 'With two lines.'],
                name: 'MyEvent',
                type: { fields: [], kind: 'struct' },
            },
        ],
        generics,
    );

    expect(node).toEqual(
        eventNode({
            data: structTypeNode([], { transforms: [hiddenPrefixTransformNode([discriminator])] }),
            discriminators: [constantDiscriminatorNode(discriminator)],
            docs: 'My event.\nWith two lines.',
            identifier: 'MyEvent',
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
    ).toThrow(new CodamaError(CODAMA_ERROR__ANCHOR__EVENT_TYPE_MISSING, { name: 'MissingEvent' }));
});
