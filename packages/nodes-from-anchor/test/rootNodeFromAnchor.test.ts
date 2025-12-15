import { programNode, rootNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { rootNodeFromAnchor } from '../src';

test('it creates root nodes from IDL version 0.0', () => {
    const node = rootNodeFromAnchor({
        instructions: [],
        metadata: { address: '1111' },
        name: 'myProgram',
        version: '1.2.3',
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
