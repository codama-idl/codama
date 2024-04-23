import { instructionArgumentNode, numberTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { instructionArgumentNodeFromAnchorV00 } from '../../src/index.js';

test('it creates instruction argument nodes', t => {
    const node = instructionArgumentNodeFromAnchorV00({
        name: 'myInstructionArgument',
        type: 'u8',
    });

    t.deepEqual(
        node,
        instructionArgumentNode({
            name: 'myInstructionArgument',
            type: numberTypeNode('u8'),
        }),
    );
});
