import { instructionArgumentNode, numberTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { instructionArgumentNodeFromAnchorV01 } from '../../src/index.js';

test('it creates instruction argument nodes', () => {
    const node = instructionArgumentNodeFromAnchorV01({
        name: 'my_instruction_argument',
        type: 'u8',
    });

    expect(node).toEqual(
        instructionArgumentNode({
            name: 'myInstructionArgument',
            type: numberTypeNode('u8'),
        }),
    );
});
