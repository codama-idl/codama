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
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { eventNodeFromAnchorV00, getAnchorEventDiscriminatorV00 } from '../../src';

test('it creates event nodes with anchor discriminators', () => {
    // When we convert an Anchor event.
    const node = eventNodeFromAnchorV00({
        fields: [{ index: false, name: 'amount', type: 'u32' }],
        name: 'MyEvent',
    });

    // Then we expect an event node whose data is prefixed by a hidden discriminator.
    const discriminator = constantValueNode(
        bytesTypeNode({ transforms: [fixedSizeTransformNode(8)] }),
        getAnchorEventDiscriminatorV00('MyEvent'),
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

test('it creates event nodes with no fields', () => {
    // When we convert an Anchor event without fields.
    const node = eventNodeFromAnchorV00({
        fields: [],
        name: 'EmptyEvent',
    });

    // Then we expect an event node whose empty data is prefixed by a hidden discriminator.
    const discriminator = constantValueNode(
        bytesTypeNode({ transforms: [fixedSizeTransformNode(8)] }),
        getAnchorEventDiscriminatorV00('EmptyEvent'),
    );
    expect(node).toEqual(
        eventNode({
            data: structTypeNode([], { transforms: [hiddenPrefixTransformNode([discriminator])] }),
            discriminators: [constantDiscriminatorNode(discriminator)],
            identifier: 'EmptyEvent',
        }),
    );
});
