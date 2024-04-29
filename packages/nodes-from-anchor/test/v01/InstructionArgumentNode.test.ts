import { instructionArgumentNode, numberTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { instructionArgumentNodeFromAnchorV01 } from '../../src/index.js';

test('it creates instruction argument nodes', t => {
    const node = instructionArgumentNodeFromAnchorV01({
        name: 'my_instruction_argument',
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
