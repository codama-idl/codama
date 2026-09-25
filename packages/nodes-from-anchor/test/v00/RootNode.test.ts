import { programNode, rootNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { rootNodeFromAnchorV00 } from '../../src';

test('it creates root nodes', () => {
    // When we convert an Anchor IDL into a root node.
    const node = rootNodeFromAnchorV00({
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

test('it creates root nodes with additional programs', () => {
    // When we convert an Anchor IDL with additional programs into a root node.
    const node = rootNodeFromAnchorV00(
        {
            instructions: [],
            metadata: { address: '1111' },
            name: 'my_program',
            version: '1.2.3',
        },
        [
            {
                instructions: [],
                metadata: { address: '2222' },
                name: 'my_other_program',
                version: '4.5.6',
            },
        ],
    );

    // Then we expect the additional programs to be converted too.
    expect(node).toEqual(
        rootNode(programNode({ identifier: 'my_program', publicKey: '1111', version: '1.2.3' }), {
            additionalPrograms: [programNode({ identifier: 'my_other_program', publicKey: '2222', version: '4.5.6' })],
        }),
    );
});
