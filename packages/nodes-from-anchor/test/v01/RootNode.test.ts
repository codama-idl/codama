import { programNode, rootNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { rootNodeFromAnchorV01 } from '../../src';

test('it creates root nodes', () => {
    const node = rootNodeFromAnchorV01({
        address: '1111',
        instructions: [],
        metadata: {
            name: 'myProgram',
            spec: '0.1.0',
            version: '1.2.3',
        },
    });

    expect(node).toEqual(
        rootNode(
            programNode({
                name: 'myProgram',
                publicKey: '1111',
                version: '1.2.3',
            }),
        ),
    );
});
