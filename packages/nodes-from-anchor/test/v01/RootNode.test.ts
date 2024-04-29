import { programNode, rootNode } from '@kinobi-so/nodes';
import test from 'ava';

import { rootNodeFromAnchorV01 } from '../../src/index.js';

test('it creates root nodes', t => {
    const node = rootNodeFromAnchorV01({
        address: '1111',
        instructions: [],
        metadata: {
            name: 'myProgram',
            spec: '0.1.0',
            version: '1.2.3',
        },
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
