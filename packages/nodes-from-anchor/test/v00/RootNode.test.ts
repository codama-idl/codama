import { programNode, rootNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { rootNodeFromAnchorV00 } from '../../src';

test('it creates root nodes', () => {
    const node = rootNodeFromAnchorV00({
        instructions: [],
        metadata: { address: '1111' },
        name: 'myProgram',
        version: '1.2.3',
    });

    expect(node).toEqual(
        rootNode(
            programNode({
                name: 'myProgram',
                origin: 'anchor',
                publicKey: '1111',
                version: '1.2.3',
            }),
        ),
    );
});
