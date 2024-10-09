import { numberTypeNode, sizePrefixTypeNode, stringTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates struct type nodes', () => {
    const node = typeNodeFromAnchorV00({
        fields: [
            { name: 'name', type: 'string' },
            { name: 'age', type: 'u8' },
        ],
        kind: 'struct',
    });

    expect(node).toEqual(
        structTypeNode([
            structFieldTypeNode({
                name: 'name',
                type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')),
            }),
            structFieldTypeNode({ name: 'age', type: numberTypeNode('u8') }),
        ]),
    );
});
