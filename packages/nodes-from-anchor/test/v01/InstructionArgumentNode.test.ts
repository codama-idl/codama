import { instructionArgumentNode, numberTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, instructionArgumentNodeFromAnchorV01 } from '../../src';

const generics = {} as GenericsV01;

test('it creates instruction argument nodes', () => {
    const node = instructionArgumentNodeFromAnchorV01(
        {
            name: 'my_instruction_argument',
            type: 'u8',
        },
        generics,
    );

    expect(node).toEqual(
        instructionArgumentNode({
            name: 'myInstructionArgument',
            type: numberTypeNode('u8'),
        }),
    );
});
