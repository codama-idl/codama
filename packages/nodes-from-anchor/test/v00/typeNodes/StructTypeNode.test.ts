import {
    integerTypeNode,
    sizePrefixTransformNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates struct type nodes', () => {
    // When we convert the Anchor type.
    const node = typeNodeFromAnchorV00({
        fields: [
            { name: 'name', type: 'string' },
            { name: 'age', type: 'u8' },
        ],
        kind: 'struct',
    });

    // Then we expect the equivalent Codama type node.
    expect(node).toEqual(
        structTypeNode([
            structFieldTypeNode({
                identifier: 'name',
                type: stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
            }),
            structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u8') }),
        ]),
    );
});
