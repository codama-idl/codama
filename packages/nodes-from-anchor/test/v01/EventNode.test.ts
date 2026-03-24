import { CODAMA_ERROR__ANCHOR__EVENT_TYPE_MISSING, isCodamaError } from '@codama/errors';
import {
    bytesTypeNode,
    eventNode,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
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
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: fixedSizeTypeNode(bytesTypeNode(), 8),
                }),
                structFieldTypeNode({
                    name: 'amount',
                    type: numberTypeNode('u32'),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'myEvent',
        }),
    );
});

test('it throws when the backing event type is missing', () => {
    try {
        eventNodeFromAnchorV01(
            {
                discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
                name: 'MissingEvent',
            },
            [],
            generics,
        );
        expect.unreachable('Expected eventNodeFromAnchorV01 to throw');
    } catch (error) {
        expect(isCodamaError(error, CODAMA_ERROR__ANCHOR__EVENT_TYPE_MISSING)).toBe(true);
    }
});
