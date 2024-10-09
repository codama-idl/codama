import { instructionArgumentNode, numberTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { instructionArgumentNodeFromAnchorV00 } from '../../src';

test('it creates instruction argument nodes', () => {
    const node = instructionArgumentNodeFromAnchorV00({
        name: 'myInstructionArgument',
        type: 'u8',
    });

    expect(node).toEqual(
        instructionArgumentNode({
            name: 'myInstructionArgument',
            type: numberTypeNode('u8'),
        }),
    );
});
