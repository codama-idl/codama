import {
    bytesTypeNode,
    constantDiscriminatorNode,
    constantValueNode,
    eventNode,
    fixedSizeTypeNode,
    hiddenPrefixTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { eventNodeFromAnchorV00, getAnchorEventDiscriminatorV00 } from '../../src';

test('it creates event nodes with anchor discriminators', () => {
    const node = eventNodeFromAnchorV00({
        fields: [{ index: false, name: 'amount', type: 'u32' }],
        name: 'MyEvent',
    });

    expect(node).toEqual(
        eventNode({
            data: hiddenPrefixTypeNode(
                structTypeNode([structFieldTypeNode({ name: 'amount', type: numberTypeNode('u32') })]),
                [constantValueNode(fixedSizeTypeNode(bytesTypeNode(), 8), getAnchorEventDiscriminatorV00('MyEvent'))],
            ),
            discriminators: [
                constantDiscriminatorNode(
                    constantValueNode(fixedSizeTypeNode(bytesTypeNode(), 8), getAnchorEventDiscriminatorV00('MyEvent')),
                ),
            ],
            name: 'myEvent',
        }),
    );
});

test('it creates event nodes with no fields', () => {
    const node = eventNodeFromAnchorV00({
        fields: [],
        name: 'EmptyEvent',
    });

    expect(node).toEqual(
        eventNode({
            data: hiddenPrefixTypeNode(structTypeNode([]), [
                constantValueNode(fixedSizeTypeNode(bytesTypeNode(), 8), getAnchorEventDiscriminatorV00('EmptyEvent')),
            ]),
            discriminators: [
                constantDiscriminatorNode(
                    constantValueNode(
                        fixedSizeTypeNode(bytesTypeNode(), 8),
                        getAnchorEventDiscriminatorV00('EmptyEvent'),
                    ),
                ),
            ],
            name: 'emptyEvent',
        }),
    );
});
