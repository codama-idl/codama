import { programNode, rootNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { rootNodeFromAnchor } from '../src';

test('it creates root nodes from IDL version 0.0', () => {
    // When we convert an Anchor IDL version 0.0 into a root node.
    const node = rootNodeFromAnchor({
        instructions: [],
        metadata: { address: '1111' },
        name: 'my_program',
        version: '1.2.3',
    });

    // Then we expect a root node wrapping the converted program.
    expect(node).toEqual(
        rootNode(
            programNode({
                identifier: 'my_program',
                publicKey: '1111',
                version: '1.2.3',
            }),
        ),
    );
});
