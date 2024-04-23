import { programNode, rootNode } from '@kinobi-so/nodes';
import test from 'ava';

import { rootNodeFromAnchorV00 } from '../../src/index.js';

test('it creates root nodes', t => {
    const node = rootNodeFromAnchorV00({
        instructions: [],
        metadata: { address: '1111' },
        name: 'myProgram',
        version: '1.2.3',
    });

    t.deepEqual(
        node,
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
