import { programNode, rootNode } from '@kinobi-so/nodes';
import test from 'ava';

import { rootNodeFromAnchor } from '../src/index.js';

test('it creates root nodes from IDL version 0.0', t => {
    const node = rootNodeFromAnchor({
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
